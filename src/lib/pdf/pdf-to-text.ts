/**
 * Dedicated PDF to Text Extraction Engine
 * 100% in-browser text extraction using Mozilla PDF.js.
 * Implements position-aware reading-order reconstruction, page separators,
 * scanned document detection, and UTF-8 text file packaging.
 */

import { validatePdfMagicBytes, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { getPdfJs } from './pdf-renderer';

export interface PdfToTextProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

interface PdfJsTextItem {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
}

interface PdfJsTextContent {
  items: (PdfJsTextItem | unknown)[];
}

interface PdfJsTextPage {
  getTextContent: (options?: { normalizeWhitespace?: boolean }) => Promise<PdfJsTextContent>;
  cleanup: () => Promise<void>;
}

interface PdfJsTextDoc {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsTextPage>;
  cleanup: () => Promise<void>;
}

interface PdfJsTextLoadingTask {
  promise: Promise<PdfJsTextDoc>;
  destroy: () => Promise<void>;
}

export interface PdfJsTextModule {
  getDocument: (params: { data: Uint8Array }) => PdfJsTextLoadingTask;
}

export interface PdfToTextOptions {
  file: File | { name: string; buffer: ArrayBuffer };
  outputFileName?: string;
  onProgress?: PdfToTextProgressCallback;
  pdfjsOverride?: PdfJsTextModule; // Allows headless testing
}

export interface PageTextResult {
  pageNumber: number;
  text: string;
  characterCount: number;
  wordCount: number;
}

export interface PdfToTextResult {
  fullText: string;
  blob: Blob;
  fileName: string;
  totalPages: number;
  totalCharacters: number;
  totalWords: number;
  pages: PageTextResult[];
  isScanned: boolean; // Flagged when document has negligible selectable text
  scannedWarning?: string;
}

interface TextItemWithPosition {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Reconstructs lines and paragraphs using item 2D coordinates
 */
function reconstructPageText(items: TextItemWithPosition[]): string {
  if (items.length === 0) return '';

  // Filter out empty items
  const validItems = items.filter((item) => item.str && item.str.trim().length > 0);
  if (validItems.length === 0) return '';

  // Group items into lines based on Y coordinate (within tolerance)
  const Y_TOLERANCE = 4.0;
  const lines: { y: number; items: TextItemWithPosition[] }[] = [];

  for (const item of validItems) {
    let matchedLine = lines.find((l) => Math.abs(l.y - item.y) <= Y_TOLERANCE);
    if (!matchedLine) {
      matchedLine = { y: item.y, items: [] };
      lines.push(matchedLine);
    }
    matchedLine.items.push(item);
  }

  // Sort lines from top to bottom (in PDF coordinates, higher Y is higher on page)
  lines.sort((a, b) => b.y - a.y);

  const formattedLines: string[] = [];
  let prevY: number | null = null;

  for (const line of lines) {
    // Sort items horizontally from left to right
    line.items.sort((a, b) => a.x - b.x);

    // Join items on the line, ensuring space if items are separated
    let lineStr = '';
    let prevItemEnd: number | null = null;

    for (const it of line.items) {
      if (prevItemEnd !== null && it.x > prevItemEnd + 2.0 && !lineStr.endsWith(' ') && !it.str.startsWith(' ')) {
        lineStr += ' ';
      }
      lineStr += it.str;
      prevItemEnd = it.x + (it.width || 0);
    }

    // Check for paragraph gap between lines
    if (prevY !== null && Math.abs(prevY - line.y) > 18.0) {
      formattedLines.push(''); // Empty line for paragraph break
    }

    formattedLines.push(lineStr.trim());
    prevY = line.y;
  }

  return formattedLines.join('\n').trim();
}

/**
 * Extracts selectable text layers from all pages of a PDF document.
 */
export async function extractTextFromPdfDocument({
  file,
  outputFileName,
  onProgress,
  pdfjsOverride,
}: PdfToTextOptions): Promise<PdfToTextResult> {
  let arrayBuffer: ArrayBuffer;
  let baseFileName = 'document';

  if (file instanceof File) {
    baseFileName = file.name.replace(/\.[^/.]+$/, '');
    const validation = await validatePdfMagicBytes(file);
    if (!validation.valid) {
      throw new Error(`Invalid PDF document. ${validation.error || ''}`);
    }
    arrayBuffer = await file.arrayBuffer();
  } else {
    baseFileName = file.name.replace(/\.[^/.]+$/, '');
    const validation = await validatePdfMagicBytes(file.buffer);
    if (!validation.valid) {
      throw new Error(`Invalid PDF document. ${validation.error || ''}`);
    }
    arrayBuffer = file.buffer;
  }

  onProgress?.(0, 10, 'Loading PDF text streams...', 10);

  const pdfjs = (pdfjsOverride || (await getPdfJs())) as unknown as PdfJsTextModule;
  let loadingTask: PdfJsTextLoadingTask | null = null;
  let doc: PdfJsTextDoc | null = null;

  try {
    loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
    doc = await loadingTask.promise;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (msg.includes('password') || msg.includes('encrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before extracting text.');
    }
    throw new Error('Could not parse PDF. The file may be damaged or corrupted.');
  }

  const totalPages = doc.numPages;
  if (totalPages === 0) {
    throw new Error('This PDF contains zero pages.');
  }

  const pageResults: PageTextResult[] = [];
  const fullTextPieces: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const progressPct = 15 + Math.round((i / totalPages) * 75);
    onProgress?.(
      i,
      totalPages,
      `Extracting text from page ${i} of ${totalPages}...`,
      progressPct
    );

    const page = await doc.getPage(i);
    const content = await page.getTextContent({ normalizeWhitespace: true });

    const positionedItems: TextItemWithPosition[] = [];
    for (const item of content.items) {
      const rawItem = item as PdfJsTextItem;
      if (rawItem && typeof rawItem.str === 'string') {
        const transform = rawItem.transform || [1, 0, 0, 1, 0, 0];
        positionedItems.push({
          str: rawItem.str,
          x: transform[4] || 0,
          y: transform[5] || 0,
          width: rawItem.width || 0,
          height: rawItem.height || 0,
        });
      }
    }

    const pageText = reconstructPageText(positionedItems);
    const wordCount = pageText ? pageText.split(/\s+/).filter(Boolean).length : 0;
    const charCount = pageText.length;

    pageResults.push({
      pageNumber: i,
      text: pageText,
      characterCount: charCount,
      wordCount,
    });

    fullTextPieces.push(`--- Page ${i} ---\n\n` + (pageText || '(No selectable text found on this page)'));
    await page.cleanup();
  }

  await doc.cleanup();
  if (loadingTask) {
    await loadingTask.destroy();
  }

  const fullText = fullTextPieces.join('\n\n');
  const totalCharacters = pageResults.reduce((acc, p) => acc + p.characterCount, 0);
  const totalWords = pageResults.reduce((acc, p) => acc + p.wordCount, 0);

  // Scanned / image-only detection heuristic:
  // If average characters per page is under 5 and total characters under 25 across multi-page,
  // document is virtually guaranteed to be scanned images.
  const isScanned = totalPages > 0 && totalCharacters < totalPages * 5;
  const scannedWarning = isScanned
    ? 'This PDF appears to contain scanned pages without selectable text. PDF to Text extracts existing text layers and cannot perform OCR on image-only pages. OCR support will be available in a future tool.'
    : undefined;

  // Generate UTF-8 Text Blob
  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  const defaultFileName = `${baseFileName}-extracted-text.txt`;
  const sanitizedName = sanitizeDownloadFilename(outputFileName || defaultFileName, defaultFileName);

  onProgress?.(totalPages, totalPages, 'Text extraction complete!', 100);

  return {
    fullText,
    blob,
    fileName: sanitizedName,
    totalPages,
    totalCharacters,
    totalWords,
    pages: pageResults,
    isScanned,
    scannedWarning,
  };
}

export const pdfToText = extractTextFromPdfDocument;
