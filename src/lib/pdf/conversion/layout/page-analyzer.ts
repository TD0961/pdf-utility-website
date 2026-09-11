/**
 * iLikePDF — Coordinate-Aware Page Layout & Text Flow Analyzer
 * Extracts positional text stream data using Mozilla PDF.js.
 * Reconstructs reading order, lines, paragraphs, and headings client-side.
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getPdfJs } from '@/lib/pdf/pdf-renderer';
import {
  ConversionDocumentLayout,
  ConversionPageLayout,
  TextBlock,
  TextLine,
  TextSpan,
  FontDescriptor,
  BoundingBox,
  CancellationToken,
} from '../types';

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

  const rawItems = (textContent.items || [])
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

  // 1. Sort items top-to-bottom, left-to-right (with a vertical tolerance band)
  const Y_TOLERANCE = 4.0;
  rawItems.sort((a, b) => {
    if (Math.abs(a.box.y - b.box.y) <= Y_TOLERANCE) {
      return a.box.x - b.box.x;
    }
    return a.box.y - b.box.y;
  });

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

  // 3. Group lines into coherent paragraph blocks
  const blocks: TextBlock[] = [];
  if (lines.length > 0) {
    let currentBlockLines: TextLine[] = [lines[0]];

    for (let i = 1; i < lines.length; i++) {
      const prevLine = lines[i - 1];
      const currLine = lines[i];

      const lineSpacing = currLine.box.y - (prevLine.box.y + prevLine.box.height);
      const fontSizeDiff = Math.abs(currLine.dominantFontSize - prevLine.dominantFontSize);

      // Start a new block if line spacing is large or font size changes significantly
      const isNewParagraph = lineSpacing > prevLine.dominantFontSize * 1.5 || fontSizeDiff > 3;

      if (isNewParagraph) {
        blocks.push(buildBlockFromLines(currentBlockLines));
        currentBlockLines = [currLine];
      } else {
        currentBlockLines.push(currLine);
      }
    }

    if (currentBlockLines.length > 0) {
      blocks.push(buildBlockFromLines(currentBlockLines));
    }
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
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const totalPages = doc.numPages;

  const pages: ConversionPageLayout[] = [];
  const allFontSizes: number[] = [];

  try {
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

  // Semantic classification: detect headings based on font size threshold
  for (const p of pages) {
    for (const b of p.blocks) {
      if (b.fontSize >= medianBodyFontSize * 1.5 && b.text.length < 140) {
        b.type = 'heading1';
      } else if (b.fontSize >= medianBodyFontSize * 1.25 && b.text.length < 200) {
        b.type = 'heading2';
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
  };
}
