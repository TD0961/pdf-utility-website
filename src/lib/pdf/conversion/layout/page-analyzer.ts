/**
 * PDFSimplify — Coordinate-Aware Page Layout & Text Flow Analyzer
 * Extracts positional text stream data using Mozilla PDF.js.
 * Reconstructs reading order, lines, paragraphs, and headings client-side.
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getPdfJs, getPdfLoadingParams } from '@/lib/pdf/pdf-renderer';
import {
  ConversionDocumentLayout,
  ConversionPageLayout,
  TextBlock,
  TextLine,
  TextSpan,
  FontDescriptor,
  BoundingBox,
  CancellationToken,
  PdfOutlineNode,
  TocItemData,
} from '../types';
import { clusterIntoRows, detectColumnAnchors, alignRowsToColumns } from '@/lib/pdf/extraction/table-detector';

interface RawTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

function parseFontDescriptor(fontName: string, transform: number[]): FontDescriptor {
  const scaleY = Math.abs(transform[3]) || 12;
  const scaleX = Math.abs(transform[0]) || 12;
  const size = Math.round(Math.max(scaleX, scaleY) * 10) / 10;

  const lowerName = (fontName || '').toLowerCase();
  const isBold = /bold|black|heavy|semibold|b\b/.test(lowerName);
  const isItalic = /italic|oblique|slanted|it\b/.test(lowerName);

  return {
    name: fontName || 'Helvetica',
    size: size > 0 ? size : 12,
    isBold,
    isItalic,
  };
}

function isRawTextItem(item: unknown): item is RawTextItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'str' in item &&
    typeof (item as RawTextItem).str === 'string' &&
    (item as RawTextItem).str.trim().length > 0
  );
}

/**
 * Reconstructs page layout from PDF text streams
 */
function groupItemsIntoColumns(items: RawItem[]): RawItem[] {
  if (items.length <= 4) return items;

  let minX = Infinity;
  let maxX = -Infinity;
  for (const it of items) {
    if (it.box.x < minX) minX = it.box.x;
    if (it.box.x + it.box.width > maxX) maxX = it.box.x + it.box.width;
  }

  const contentWidth = maxX - minX;
  if (contentWidth < 250) {
    return items;
  }

  const GUTTER_SEARCH_START = minX + contentWidth * 0.35;
  const GUTTER_SEARCH_END = minX + contentWidth * 0.65;

  let bestSplitX = -1;
  let maxGutter = 0;

  for (let splitCandidate = GUTTER_SEARCH_START; splitCandidate <= GUTTER_SEARCH_END; splitCandidate += 8) {
    const leftItems = items.filter((it) => it.box.x + it.box.width <= splitCandidate + 4);
    const rightItems = items.filter((it) => it.box.x >= splitCandidate - 4);
    const spanningItems = items.filter(
      (it) => it.box.x < splitCandidate - 4 && it.box.x + it.box.width > splitCandidate + 4
    );

    if (
      leftItems.length >= 2 &&
      rightItems.length >= 2 &&
      spanningItems.length <= (leftItems.length + rightItems.length) * 0.25
    ) {
      const maxLeftX = Math.max(...leftItems.map((it) => it.box.x + it.box.width));
      const minRightX = Math.min(...rightItems.map((it) => it.box.x));
      const gutter = minRightX - maxLeftX;
      if (gutter > 10 && gutter > maxGutter) {
        maxGutter = gutter;
        bestSplitX = (maxLeftX + minRightX) / 2;
      }
    }
  }

  if (bestSplitX > 0 && maxGutter >= 10) {
    const topItems: RawItem[] = [];
    const leftColumnItems: RawItem[] = [];
    const rightColumnItems: RawItem[] = [];
    const bottomItems: RawItem[] = [];

    const nonSpanningLeft = items.filter((it) => it.box.x + it.box.width <= bestSplitX);
    const nonSpanningRight = items.filter((it) => it.box.x >= bestSplitX);

    const leftYs = nonSpanningLeft.map((it) => it.box.y);
    const rightYs = nonSpanningRight.map((it) => it.box.y);
    const allYs = [...leftYs, ...rightYs];
    const colMinY = allYs.length > 0 ? Math.min(...allYs) : 0;

    for (const it of items) {
      const itMidY = it.box.y + it.box.height / 2;
      if (it.box.x < bestSplitX - 4 && it.box.x + it.box.width > bestSplitX + 4) {
        if (itMidY < colMinY + 10) {
          topItems.push(it);
        } else {
          bottomItems.push(it);
        }
      } else if (it.box.x + it.box.width / 2 < bestSplitX) {
        leftColumnItems.push(it);
      } else {
        rightColumnItems.push(it);
      }
    }

    const sortY = (a: RawItem, b: RawItem) => {
      if (Math.abs(a.box.y - b.box.y) <= 4.0) return a.box.x - b.box.x;
      return a.box.y - b.box.y;
    };

    topItems.sort(sortY);
    leftColumnItems.sort(sortY);
    rightColumnItems.sort(sortY);
    bottomItems.sort(sortY);

    return [...topItems, ...leftColumnItems, ...rightColumnItems, ...bottomItems];
  }

  return items;
}

const Y_TOLERANCE = 4.0;

type RawItem = {
  str: string;
  box: BoundingBox;
  font: FontDescriptor;
};

export async function analyzePageLayout(
  pdfDoc: PDFDocumentProxy,
  pageNumber: number,
  cancellationToken?: CancellationToken
): Promise<ConversionPageLayout> {
  if (cancellationToken?.isCancelled) {
    throw new Error('Conversion cancelled by user.');
  }

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.0 });
  const width = viewport.width;
  const height = viewport.height;
  const rotation = viewport.rotation || 0;

  let textContent: { items: unknown[] };
  try {
    textContent = await page.getTextContent();
  } catch {
    textContent = { items: [] };
  }

  let rawItems: RawItem[] = (textContent.items || [])
    .filter(isRawTextItem)
    .map((item) => {
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const font = parseFontDescriptor(item.fontName, transform);
      const pdfX = transform[4] || 0;
      const pdfY = transform[5] || 0;

      // Convert from PDF bottom-left coordinate space to top-left screen space
      const top = height - pdfY - font.size;
      const left = pdfX;
      const itemWidth = item.width > 0 ? item.width : item.str.length * font.size * 0.55;
      const itemHeight = font.size;

      return {
        str: item.str,
        box: { x: Math.max(0, left), y: Math.max(0, top), width: itemWidth, height: itemHeight },
        font,
      };
    });

  await page.cleanup();

  if (rawItems.length === 0) {
    return {
      pageNumber,
      width,
      height,
      rotation,
      blocks: [],
      rawItemCount: 0,
      hasSelectableText: false,
    };
  }

  // 1. Column detection and reading order segmentation
  rawItems = groupItemsIntoColumns(rawItems);

  // 2. Group items into lines
  const lines: TextLine[] = [];
  let currentLineItems: typeof rawItems = [];
  let currentLineY = rawItems[0]?.box.y ?? 0;

  for (const item of rawItems) {
    if (Math.abs(item.box.y - currentLineY) <= Y_TOLERANCE) {
      currentLineItems.push(item);
    } else {
      if (currentLineItems.length > 0) {
        lines.push(buildLineFromItems(currentLineItems));
      }
      currentLineItems = [item];
      currentLineY = item.box.y;
    }
  }

  if (currentLineItems.length > 0) {
    lines.push(buildLineFromItems(currentLineItems));
  }

  // 3. Group lines into coherent semantic blocks (TOC items, tables, lists, and paragraphs)
  const blocks: TextBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for Table of Contents line
    const tocData = detectTocLine(line, width);
    if (tocData) {
      blocks.push({
        type: 'tocItem',
        box: line.box,
        lines: [line],
        text: line.text,
        fontSize: line.dominantFontSize,
        isBold: line.spans.some((s) => s.font.isBold),
        isItalic: line.spans.every((s) => s.font.isItalic),
        alignment: 'left',
        tocData,
      });
      i++;
      continue;
    }

    // Check for tabular data block across consecutive lines
    const tableCandidateLines: TextLine[] = [];
    let tableLookahead = i;
    while (
      tableLookahead < lines.length &&
      lines[tableLookahead].spans.length >= 2 &&
      !detectTocLine(lines[tableLookahead], width)
    ) {
      tableCandidateLines.push(lines[tableLookahead]);
      tableLookahead++;
    }

    if (tableCandidateLines.length >= 2) {
      const detectedTable = buildTableFromLines(tableCandidateLines);
      if (detectedTable) {
        blocks.push(detectedTable);
        i = tableLookahead;
        continue;
      }
    }

    // Check for List Item line
    if (isListItemLine(line.text)) {
      blocks.push({
        type: 'listItem',
        box: line.box,
        lines: [line],
        text: line.text,
        fontSize: line.dominantFontSize,
        isBold: line.spans.some((s) => s.font.isBold),
        isItalic: line.spans.every((s) => s.font.isItalic),
        alignment: 'left',
      });
      i++;
      continue;
    }

    // Standard paragraph grouping
    const currentBlockLines: TextLine[] = [line];
    i++;

    while (i < lines.length) {
      const nextLine = lines[i];
      if (
        detectTocLine(nextLine, width) ||
        isListItemLine(nextLine.text) ||
        (nextLine.spans.length >= 2 && i + 1 < lines.length && lines[i + 1].spans.length >= 2)
      ) {
        break;
      }

      const prevLine = currentBlockLines[currentBlockLines.length - 1];
      const lineSpacing = nextLine.box.y - (prevLine.box.y + prevLine.box.height);
      const fontSizeDiff = Math.abs(nextLine.dominantFontSize - prevLine.dominantFontSize);

      if (lineSpacing > prevLine.dominantFontSize * 1.5 || fontSizeDiff > 3) {
        break;
      }

      currentBlockLines.push(nextLine);
      i++;
    }

    blocks.push(buildBlockFromLines(currentBlockLines));
  }

  return {
    pageNumber,
    width,
    height,
    rotation,
    blocks,
    rawItemCount: rawItems.length,
    hasSelectableText: rawItems.length > 0,
  };
}

function detectTocLine(line: TextLine, pageWidth: number): TocItemData | null {
  const text = line.text.trim();
  if (!text) return null;

  // Pattern 1: Title followed by dot/dash leaders and trailing page number
  // e.g. "Chapter 1: Getting Started ................ 12" or "1. Overview . . . . . . 3"
  const leaderMatch = text.match(/^(.+?)(?:\s*[\.·\-_…]{2,}\s*|\s{3,})(\d+|[ivxlcdmIVXLCDM]+)$/);
  if (leaderMatch) {
    const rawTitle = leaderMatch[1].replace(/[\.·\-_…]+$/, '').trim();
    const pageNumber = leaderMatch[2].trim();
    if (rawTitle.length >= 2 && pageNumber.length >= 1 && pageNumber.length <= 6) {
      const level = /^\s*(\d+\.\d+|\([a-z]\)|\b[A-Z]\.)/i.test(rawTitle) ? 2 : 1;
      return {
        title: rawTitle,
        pageNumber,
        level,
      };
    }
  }

  // Pattern 2: Multi-span line where first span is on left and last span is a page number near right margin
  if (line.spans.length >= 2) {
    const firstSpan = line.spans[0];
    const lastSpan = line.spans[line.spans.length - 1];
    const lastStr = lastSpan.text.trim();
    const isNum = /^(\d+|[ivxlcdmIVXLCDM]+)$/.test(lastStr);

    if (isNum && lastSpan.box.x >= pageWidth * 0.65 && firstSpan.box.x <= pageWidth * 0.45) {
      const titleSpans = line.spans.slice(0, line.spans.length - 1);
      const title = titleSpans
        .map((s) => s.text)
        .join(' ')
        .replace(/[\.·\-_…]{2,}/g, '')
        .trim();
      if (title.length >= 2) {
        return {
          title,
          pageNumber: lastStr,
          level: 1,
        };
      }
    }
  }

  return null;
}

function isListItemLine(text: string): boolean {
  const t = text.trim();
  return /^([•\-\*–—]|(?:\d+|[a-zA-Z])[\.\)])\s+/.test(t);
}

function buildTableFromLines(lines: TextLine[]): TextBlock | null {
  const rawItems = lines.flatMap((l) =>
    l.spans.map((s) => ({
      str: s.text,
      x: s.box.x,
      y: s.box.y,
      width: s.box.width,
      height: s.box.height,
    }))
  );

  const clustered = clusterIntoRows(rawItems);
  const anchors = detectColumnAnchors(clustered, 25);
  if (anchors.length < 2) return null;

  const grid = alignRowsToColumns(clustered, anchors);
  if (grid.length < 2 || !grid.some((r) => r.filter(Boolean).length >= 2)) {
    return null;
  }

  const minX = Math.min(...lines.map((l) => l.box.x));
  const maxX = Math.max(...lines.map((l) => l.box.x + l.box.width));
  const minY = Math.min(...lines.map((l) => l.box.y));
  const maxY = Math.max(...lines.map((l) => l.box.y + l.box.height));

  return {
    type: 'table',
    box: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    lines,
    text: lines.map((l) => l.text).join('\n'),
    fontSize: lines[0]?.dominantFontSize || 12,
    isBold: false,
    isItalic: false,
    alignment: 'left',
    tableData: {
      headers: grid[0],
      rows: grid,
    },
  };
}

function buildLineFromItems(items: { str: string; box: BoundingBox; font: FontDescriptor }[]): TextLine {
  // Sort spans left-to-right within the line
  items.sort((a, b) => a.box.x - b.box.x);

  const spans: TextSpan[] = items.map((it) => ({
    text: it.str,
    box: it.box,
    font: it.font,
  }));

  const text = items.map((it) => it.str).join(' ').trim();
  const minX = Math.min(...items.map((it) => it.box.x));
  const maxX = Math.max(...items.map((it) => it.box.x + it.box.width));
  const minY = Math.min(...items.map((it) => it.box.y));
  const maxY = Math.max(...items.map((it) => it.box.y + it.box.height));

  const dominantFontSize = items.reduce((max, it) => Math.max(max, it.font.size), 12);

  return {
    text,
    box: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    spans,
    dominantFontSize,
    isHeadingCandidate: dominantFontSize >= 15,
  };
}

function buildBlockFromLines(lines: TextLine[]): TextBlock {
  const text = lines.map((l) => l.text).join(' ');
  const minX = Math.min(...lines.map((l) => l.box.x));
  const maxX = Math.max(...lines.map((l) => l.box.x + l.box.width));
  const minY = Math.min(...lines.map((l) => l.box.y));
  const maxY = Math.max(...lines.map((l) => l.box.y + l.box.height));

  const dominantFontSize = lines.reduce((max, l) => Math.max(max, l.dominantFontSize), 12);
  const isBold = lines.some((l) => l.spans.some((s) => s.font.isBold));
  const isItalic = lines.every((l) => l.spans.every((s) => s.font.isItalic));

  return {
    type: 'paragraph',
    box: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    lines,
    text,
    fontSize: dominantFontSize,
    isBold,
    isItalic,
    alignment: 'left',
  };
}

function mapRawOutlineNodes(nodes: unknown[]): PdfOutlineNode[] {
  if (!Array.isArray(nodes)) return [];
  return nodes
    .filter((n): n is { title?: string; dest?: unknown; items?: unknown[] } => typeof n === 'object' && n !== null)
    .map((n) => ({
      title: String(n.title || '').trim(),
      dest: typeof n.dest === 'string' ? n.dest : undefined,
      items: Array.isArray(n.items) && n.items.length > 0 ? mapRawOutlineNodes(n.items) : undefined,
    }))
    .filter((n) => n.title.length > 0);
}

/**
 * Analyzes an entire PDF document and marks semantic hierarchy (headings vs paragraphs)
 */
export async function analyzePdfDocument(
  fileData: ArrayBuffer | Uint8Array,
  fileName: string,
  cancellationToken?: CancellationToken,
  onPageAnalyzed?: (pageNum: number, total: number) => void
): Promise<ConversionDocumentLayout> {
  const pdfjs = await getPdfJs();
  const data = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
  const loadingTask = pdfjs.getDocument(getPdfLoadingParams(data));
  const doc = await loadingTask.promise;
  const totalPages = doc.numPages;

  const pages: ConversionPageLayout[] = [];
  const allFontSizes: number[] = [];
  let outline: PdfOutlineNode[] | undefined = undefined;

  try {
    try {
      const rawOutline = await doc.getOutline();
      if (rawOutline && Array.isArray(rawOutline) && rawOutline.length > 0) {
        outline = mapRawOutlineNodes(rawOutline);
      }
    } catch {
      // Outline extraction is non-fatal
    }

    for (let i = 1; i <= totalPages; i++) {
      if (cancellationToken?.isCancelled) {
        throw new Error('Conversion cancelled by user.');
      }

      const pageLayout = await analyzePageLayout(doc, i, cancellationToken);
      pages.push(pageLayout);

      for (const b of pageLayout.blocks) {
        if (b.fontSize > 0) {
          allFontSizes.push(b.fontSize);
        }
      }

      if (onPageAnalyzed) {
        onPageAnalyzed(i, totalPages);
      }
    }
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }

  // Calculate median body font size
  allFontSizes.sort((a, b) => a - b);
  const medianBodyFontSize = allFontSizes.length > 0
    ? allFontSizes[Math.floor(allFontSizes.length / 2)]
    : 12;

  // Flatten outline titles for matching
  const outlineTitles = new Set<string>();
  if (outline) {
    const collectTitles = (nodes: PdfOutlineNode[]) => {
      for (const n of nodes) {
        outlineTitles.add(n.title.toLowerCase().trim());
        if (n.items) collectTitles(n.items);
      }
    };
    collectTitles(outline);
  }

  // Semantic classification: detect headings based on outline match or font size threshold
  for (const p of pages) {
    for (const b of p.blocks) {
      if (b.type === 'tocItem' || b.type === 'table' || b.type === 'listItem') {
        continue;
      }

      const cleanText = b.text.toLowerCase().trim();
      const matchesOutline = outlineTitles.has(cleanText);

      if (matchesOutline || (b.fontSize >= medianBodyFontSize * 1.5 && b.text.length < 140)) {
        b.type = 'heading1';
      } else if (b.fontSize >= medianBodyFontSize * 1.25 && b.text.length < 200) {
        b.type = 'heading2';
      } else if ((b.fontSize >= medianBodyFontSize * 1.15 || b.isBold) && b.text.length < 100) {
        b.type = 'heading3';
      } else {
        b.type = 'paragraph';
      }
    }
  }

  return {
    fileName,
    fileSizeBytes: data.byteLength,
    totalPages,
    pages,
    medianBodyFontSize,
    outline,
  };
}
