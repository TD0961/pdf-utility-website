/**
 * iLikePDF — Vector Header & Footer Stamping Engine
 * Adds customizable vector headers and footers to PDF pages using pdf-lib.
 * Supports dynamic tokens ({page}, {total}, {date}), alignment, and page ranges.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { assertValidPdfOutput } from './output-validator';
import { CancellationToken } from './conversion/types';

export type HeaderFooterAlignment = 'left' | 'center' | 'right';

export interface HeaderFooterOptions {
  headerText?: string;
  headerAlignment?: HeaderFooterAlignment;
  footerText?: string;
  footerAlignment?: HeaderFooterAlignment;
  fontSize?: number; // default 10
  margin?: number; // default 36 pt (0.5 inch)
  startPageNumber?: number; // default 1
  skipFirstPage?: boolean;
  pageRange?: string; // 'all' or '1-3, 5'
  cancellationToken?: CancellationToken;
}

export interface HeaderFooterResult {
  stampedBytes: Uint8Array;
  totalPages: number;
  pagesModifiedCount: number;
  durationMs: number;
}

function parsePageRange(rangeStr: string | undefined, totalPages: number): Set<number> {
  const result = new Set<number>();
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    for (let i = 1; i <= totalPages; i++) result.add(i);
    return result;
  }

  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [s, e] = trimmed.split('-');
      const start = parseInt(s, 10);
      const end = parseInt(e, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          result.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        result.add(p);
      }
    }
  }

  return result.size > 0 ? result : parsePageRange('all', totalPages);
}

function formatTokens(
  template: string,
  pageNum: number,
  totalPages: number,
  dateStr: string
): string {
  return template
    .replace(/\{page\}/gi, String(pageNum))
    .replace(/\{total\}/gi, String(totalPages))
    .replace(/\{date\}/gi, dateStr);
}

export async function addHeaderFooterToPdf(
  buffer: ArrayBuffer,
  options: HeaderFooterOptions = {}
): Promise<HeaderFooterResult> {
  const startTime = Date.now();

  if (options.cancellationToken?.isCancelled) {
    throw new Error('Header/footer stamping cancelled by user.');
  }

  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pdfDoc.getPageCount();

  const fontSize = options.fontSize || 10;
  const margin = options.margin !== undefined ? options.margin : 36;
  const skipFirst = options.skipFirstPage || false;
  const startNum = options.startPageNumber !== undefined ? options.startPageNumber : 1;
  const allowedPages = parsePageRange(options.pageRange, totalPages);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  let pagesModifiedCount = 0;

  for (let i = 0; i < totalPages; i++) {
    const pageNumber = i + 1;

    if (skipFirst && pageNumber === 1) {
      continue;
    }
    if (!allowedPages.has(pageNumber)) {
      continue;
    }

    const page = pdfDoc.getPage(i);
    const width = page.getWidth();
    const height = page.getHeight();
    const dynamicPageNum = startNum + i;

    // Header stamping
    if (options.headerText && options.headerText.trim().length > 0) {
      const resolvedHeader = formatTokens(options.headerText, dynamicPageNum, totalPages, today);
      const textWidth = font.widthOfTextAtSize(resolvedHeader, fontSize);
      const align = options.headerAlignment || 'center';

      let x = margin;
      if (align === 'center') {
        x = (width - textWidth) / 2;
      } else if (align === 'right') {
        x = width - margin - textWidth;
      }

      const y = height - margin;

      page.drawText(resolvedHeader, {
        x: Math.max(margin, x),
        y,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    // Footer stamping
    if (options.footerText && options.footerText.trim().length > 0) {
      const resolvedFooter = formatTokens(options.footerText, dynamicPageNum, totalPages, today);
      const textWidth = font.widthOfTextAtSize(resolvedFooter, fontSize);
      const align = options.footerAlignment || 'center';

      let x = margin;
      if (align === 'center') {
        x = (width - textWidth) / 2;
      } else if (align === 'right') {
        x = width - margin - textWidth;
      }

      const y = margin;

      page.drawText(resolvedFooter, {
        x: Math.max(margin, x),
        y,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    pagesModifiedCount++;
  }

  const stampedBytes = await pdfDoc.save();

  await assertValidPdfOutput(stampedBytes, {
    expectedPages: totalPages,
  });

  return {
    stampedBytes,
    totalPages,
    pagesModifiedCount,
    durationMs: Date.now() - startTime,
  };
}
