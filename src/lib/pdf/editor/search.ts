/**
 * Phase 3C.5: PDF Text Search Engine & Index Architecture
 * 100% client-side, zero-backend, deterministic literal search.
 * Computes exact PDF-space bounding boxes for search highlights,
 * supports rotation/zoom invariance via coordinates.ts, and handles scanned PDF detection.
 */

import { Rect, PdfSearchMatch, PdfSearchResult } from './types';
import { getPdfJs } from '../pdf-renderer';

export interface IndexedTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageSearchIndex {
  pageIndex: number;
  originalPageIndex: number;
  items: IndexedTextItem[];
  fullText: string;
}

export const MAX_SEARCH_QUERY_LENGTH = 200;
export const MAX_SEARCH_RESULTS = 1000;

export class PdfSearchEngine {
  private pageIndices: Map<number, PageSearchIndex> = new Map();
  private isExtracting = false;
  private isExtractionComplete = false;
  private documentGeneration = 0;
  private totalCharactersFound = 0;
  private pdfjsOverride: unknown = null;

  constructor(pdfjsOverride?: unknown) {
    this.pdfjsOverride = pdfjsOverride;
  }

  /**
   * Sets the document generation token. Stale extractions from previous generations are discarded.
   */
  public setGeneration(generation: number): void {
    this.documentGeneration = generation;
  }

  /**
   * Clears all cached indices and search state.
   */
  public reset(): void {
    this.pageIndices.clear();
    this.isExtracting = false;
    this.isExtractionComplete = false;
    this.totalCharactersFound = 0;
  }

  /**
   * Lazily extracts and indexes text from the provided PDF source bytes.
   */
  public async extractText(
    sourceBytes: Uint8Array,
    pageCount: number,
    generation: number,
    onProgress?: (indexedPages: number, totalPages: number) => void
  ): Promise<void> {
    if (this.isExtractionComplete || sourceBytes.byteLength === 0 || pageCount === 0) {
      return;
    }

    this.isExtracting = true;
    this.totalCharactersFound = 0;

    interface PdfJsDocType {
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getTextContent: (options?: { normalizeWhitespace?: boolean }) => Promise<{ items: unknown[] }>;
        cleanup?: () => Promise<void>;
      }>;
      cleanup?: () => Promise<void>;
    }
    type PdfJsLoadingTask = { promise: Promise<PdfJsDocType>; destroy: () => Promise<void> };
    type PdfJsModule = { getDocument: (params: { data: Uint8Array }) => PdfJsLoadingTask };

    let docToCleanup: { cleanup?: () => Promise<void> } | null = null;
    let loadingTaskToDestroy: { destroy: () => Promise<void> } | null = null;

    try {
      const pdfjs = (this.pdfjsOverride || (await getPdfJs())) as unknown as PdfJsModule;
      const loadingTask = pdfjs.getDocument({ data: sourceBytes.slice(0) });
      loadingTaskToDestroy = loadingTask;
      const doc = await loadingTask.promise;
      docToCleanup = doc;

      for (let i = 0; i < pageCount; i++) {
        // Abort if generation changed or reset was called
        if (generation !== this.documentGeneration) {
          return;
        }

        try {
          const page = await doc.getPage(i + 1);
          const content = await page.getTextContent({ normalizeWhitespace: true });
          const items: IndexedTextItem[] = [];
          const textPieces: string[] = [];

          for (const item of content.items) {
            const raw = item as {
              str?: string;
              transform?: number[];
              width?: number;
              height?: number;
            };

            if (raw && typeof raw.str === 'string' && raw.str.length > 0) {
              const transform = raw.transform || [1, 0, 0, 1, 0, 0];
              const itemX = transform[4] || 0;
              const itemY = transform[5] || 0;
              const itemH = raw.height || Math.abs(transform[3]) || Math.abs(transform[0]) || 12;
              const itemW = raw.width || 0;

              items.push({
                str: raw.str,
                x: itemX,
                y: itemY,
                width: itemW,
                height: itemH,
              });
              textPieces.push(raw.str);
              this.totalCharactersFound += raw.str.length;
            }
          }

          this.pageIndices.set(i, {
            pageIndex: i,
            originalPageIndex: i,
            items,
            fullText: textPieces.join(' '),
          });

          if (typeof page.cleanup === 'function') {
            await page.cleanup();
          }

          onProgress?.(i + 1, pageCount);
        } catch (pageErr) {
          console.warn(`Search indexing error on page ${i + 1}:`, pageErr);
          this.pageIndices.set(i, {
            pageIndex: i,
            originalPageIndex: i,
            items: [],
            fullText: '',
          });
        }
      }

      this.isExtractionComplete = true;
    } catch (err) {
      console.warn('Text extraction encountered an error:', err);
    } finally {
      this.isExtracting = false;
      if (docToCleanup) {
        try {
          await docToCleanup.cleanup?.();
        } catch {
          // ignore
        }
      }
      if (loadingTaskToDestroy) {
        try {
          await loadingTaskToDestroy.destroy();
        } catch {
          // ignore
        }
      }
    }
  }

  /**
   * Performs literal, case-insensitive substring search across indexed pages.
   */
  public search(
    query: string,
    pageMapping?: { pageIndex: number; originalPageIndex: number }[]
  ): PdfSearchResult {
    const sanitizedQuery = query.slice(0, MAX_SEARCH_QUERY_LENGTH).trim();
    const hasExtractedText = this.totalCharactersFound > 0;

    if (!sanitizedQuery) {
      return {
        query: '',
        totalMatches: 0,
        matches: [],
        activeMatchIndex: -1,
        isSearching: this.isExtracting,
        hasExtractedText,
      };
    }

    const matches: PdfSearchMatch[] = [];
    const lowerQuery = sanitizedQuery.toLowerCase();
    const queryLen = sanitizedQuery.length;

    // Use pageMapping if provided (visual page order) or default to index order
    const pagesToSearch = pageMapping
      ? pageMapping.map((pm) => ({
          visualIndex: pm.pageIndex,
          pageIndexKey: pm.originalPageIndex,
        }))
      : Array.from(this.pageIndices.keys()).map((k) => ({
          visualIndex: k,
          pageIndexKey: k,
        }));

    for (const { visualIndex, pageIndexKey } of pagesToSearch) {
      const pageIndexData = this.pageIndices.get(pageIndexKey);
      if (!pageIndexData) continue;

      for (let itemIdx = 0; itemIdx < pageIndexData.items.length; itemIdx++) {
        if (matches.length >= MAX_SEARCH_RESULTS) break;

        const item = pageIndexData.items[itemIdx];
        const lowerItemStr = item.str.toLowerCase();

        let startIndex = 0;
        while (startIndex <= lowerItemStr.length - queryLen) {
          const matchIdx = lowerItemStr.indexOf(lowerQuery, startIndex);
          if (matchIdx === -1) break;

          // Calculate precise substring bounding box in PDF point space
          const charW = item.str.length > 0 ? item.width / item.str.length : 0;
          const matchX = item.x + charW * matchIdx;
          const matchW = Math.max(charW * queryLen, 4);

          const rect: Rect = {
            x: matchX,
            y: item.y,
            width: matchW,
            height: item.height,
          };

          matches.push({
            pageIndex: visualIndex,
            itemIndex: itemIdx,
            matchStart: matchIdx,
            matchEnd: matchIdx + queryLen,
            rect,
            text: item.str.substring(matchIdx, matchIdx + queryLen),
          });

          if (matches.length >= MAX_SEARCH_RESULTS) break;
          startIndex = matchIdx + 1;
        }
      }

      if (matches.length >= MAX_SEARCH_RESULTS) break;
    }

    return {
      query: sanitizedQuery,
      totalMatches: matches.length,
      matches,
      activeMatchIndex: matches.length > 0 ? 0 : -1,
      isSearching: this.isExtracting,
      hasExtractedText,
    };
  }

  public isIndexingComplete(): boolean {
    return this.isExtractionComplete;
  }

  public hasSelectableText(): boolean {
    return this.totalCharactersFound > 0;
  }

  /**
   * Injects mock indexed pages for headless/unit testing
   */
  public setMockIndex(pageIndex: number, items: IndexedTextItem[]): void {
    const fullText = items.map((i) => i.str).join(' ');
    this.totalCharactersFound += fullText.length;
    this.pageIndices.set(pageIndex, {
      pageIndex,
      originalPageIndex: pageIndex,
      items,
      fullText,
    });
    this.isExtractionComplete = true;
  }
}
