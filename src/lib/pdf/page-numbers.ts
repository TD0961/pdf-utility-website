/**
 * Dedicated Add Page Numbers Engine
 * 100% in-browser page numbering using pdf-lib.
 * Adds non-destructive vector text overlay with high-precision Helvetica typography.
 * Supports configurable positions, formats, offsets, font sizes, and colors.
 * Automatically adapts coordinate geometry to page dimensions and rotations (0°, 90°, 180°, 270°).
 */

import { PDFDocument, StandardFonts, rgb, degrees, Color } from 'pdf-lib';
import { validatePdfMagicBytes, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { parsePageRanges } from './range-parser';
import { assertValidPdfOutput } from './output-validator';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right'
  | 'middle-left'
  | 'middle-right';

export type PageNumberFormat = 'numeric' | 'prefixed' | 'total' | 'prefixed-total';
export type PageNumberMargin = 'small' | 'medium' | 'large';
export type PageNumberFontSize = 'small' | 'medium' | 'large';
export type PageNumberColor = 'black' | 'gray' | 'white';

export interface AddPageNumbersProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

export interface AddPageNumbersOptions {
  file: File | { name: string; buffer: ArrayBuffer };
  position?: PageNumberPosition;
  format?: PageNumberFormat;
  startNumber?: number;
  pages?: 'all' | string; // 'all' or custom range expression like "2-10"
  margin?: PageNumberMargin;
  fontSize?: PageNumberFontSize;
  color?: PageNumberColor;
  outputFileName?: string;
  onProgress?: AddPageNumbersProgressCallback;
}

export interface AddPageNumbersResult {
  blob: Blob;
  uint8Array: Uint8Array;
  totalPages: number;
  fileSize: number;
  fileName: string;
}

const MARGIN_MAP: Record<PageNumberMargin, number> = {
  small: 15,
  medium: 30,
  large: 45,
};

const FONT_SIZE_MAP: Record<PageNumberFontSize, number> = {
  small: 9,
  medium: 12,
  large: 15,
};

const COLOR_MAP: Record<PageNumberColor, Color> = {
  black: rgb(0, 0, 0),
  gray: rgb(0.4, 0.4, 0.4),
  white: rgb(1, 1, 1),
};

/**
 * Transforms visual coordinates (xv, yv) into PDF page coordinate space
 * based on page dimensions and /Rotate metadata (0, 90, 180, 270 degrees).
 */
export function computePageNumberCoords(
  pageWidth: number,
  pageHeight: number,
  rotationAngle: number,
  visualPos: { xv: number; yv: number }
): { x: number; y: number; textRotate: number } {
  const R = ((rotationAngle % 360) + 360) % 360;
  let x = 0;
  let y = 0;

  if (R === 0) {
    x = visualPos.xv;
    y = visualPos.yv;
  } else if (R === 90) {
    x = pageWidth - visualPos.yv;
    y = visualPos.xv;
  } else if (R === 180) {
    x = pageWidth - visualPos.xv;
    y = pageHeight - visualPos.yv;
  } else if (R === 270) {
    x = visualPos.yv;
    y = pageHeight - visualPos.xv;
  }

  return { x, y, textRotate: R };
}

/**
 * Formats the page number string based on user format preference.
 */
export function formatPageNumberText(
  pageNumber: number,
  totalPages: number,
  format: PageNumberFormat
): string {
  switch (format) {
    case 'prefixed':
      return `Page ${pageNumber}`;
    case 'total':
      return `${pageNumber} / ${totalPages}`;
    case 'prefixed-total':
      return `Page ${pageNumber} of ${totalPages}`;
    case 'numeric':
    default:
      return `${pageNumber}`;
  }
}

/**
 * Adds page number overlays to pages in a PDF document.
 */
export async function addPageNumbersToPdf({
  file,
  position = 'bottom-center',
  format = 'numeric',
  startNumber = 1,
  pages = 'all',
  margin = 'medium',
  fontSize = 'medium',
  color = 'black',
  outputFileName,
  onProgress,
}: AddPageNumbersOptions): Promise<AddPageNumbersResult> {
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

  onProgress?.(0, 10, 'Loading PDF document...', 10);

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    if (pdfDoc.isEncrypted) {
      throw new Error('This PDF is password-protected. Please unlock it before adding page numbers.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (msg.includes('password') || msg.includes('encrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before adding page numbers.');
    }
    throw new Error('Could not parse PDF. The file may be damaged or corrupted.');
  }

  const totalDocPages = pdfDoc.getPageCount();
  if (totalDocPages === 0) {
    throw new Error('This PDF contains zero pages.');
  }

  // Validate starting number
  const initialNum = Math.max(1, Math.floor(startNumber));

  // Determine target pages to number
  let targetPageIndices = new Set<number>();
  if (pages === 'all') {
    targetPageIndices = new Set(Array.from({ length: totalDocPages }, (_, i) => i));
  } else {
    const rangeResult = parsePageRanges(pages, totalDocPages);
    if (!rangeResult.valid) {
      throw new Error(rangeResult.error || 'Invalid page range specified for page numbering.');
    }
    targetPageIndices = new Set(rangeResult.allPageIndices);
  }

  if (targetPageIndices.size === 0) {
    throw new Error('No pages were selected for page numbering.');
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sizePt = FONT_SIZE_MAP[fontSize] ?? 12;
  const marginPt = MARGIN_MAP[margin] ?? 30;
  const textColor = COLOR_MAP[color] ?? rgb(0, 0, 0);

  let numberedCounter = 0;

  for (let i = 0; i < totalDocPages; i++) {
    if (targetPageIndices.has(i)) {
      const page = pdfDoc.getPage(i);
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const rotationAngle = page.getRotation().angle;

      // Visual dimensions of page in viewer
      const isTransposed = rotationAngle === 90 || rotationAngle === 270;
      const visualWidth = isTransposed ? pageHeight : pageWidth;
      const visualHeight = isTransposed ? pageWidth : pageHeight;

      // Formatted text
      const currentNumber = initialNum + numberedCounter;
      const text = formatPageNumberText(currentNumber, totalDocPages, format);
      const textWidth = font.widthOfTextAtSize(text, sizePt);

      // Compute visual coordinates (xv from visual left, yv from visual bottom)
      let xv = 0;
      let yv = 0;

      switch (position) {
        case 'bottom-left':
          xv = marginPt;
          yv = marginPt;
          break;
        case 'bottom-right':
          xv = visualWidth - textWidth - marginPt;
          yv = marginPt;
          break;
        case 'bottom-center':
          xv = (visualWidth - textWidth) / 2;
          yv = marginPt;
          break;
        case 'top-left':
          xv = marginPt;
          yv = visualHeight - sizePt - marginPt;
          break;
        case 'top-right':
          xv = visualWidth - textWidth - marginPt;
          yv = visualHeight - sizePt - marginPt;
          break;
        case 'top-center':
          xv = (visualWidth - textWidth) / 2;
          yv = visualHeight - sizePt - marginPt;
          break;
        case 'middle-left':
          xv = marginPt;
          yv = (visualHeight - sizePt) / 2;
          break;
        case 'middle-right':
          xv = visualWidth - textWidth - marginPt;
          yv = (visualHeight - sizePt) / 2;
          break;
      }

      // Convert to PDF coordinates
      const { x, y, textRotate } = computePageNumberCoords(
        pageWidth,
        pageHeight,
        rotationAngle,
        { xv, yv }
      );

      page.drawText(text, {
        x,
        y,
        size: sizePt,
        font,
        color: textColor,
        rotate: degrees(textRotate),
      });

      numberedCounter++;
    }

    const progressPct = 20 + Math.round(((i + 1) / totalDocPages) * 65);
    onProgress?.(i + 1, totalDocPages, `Stamping page ${i + 1} of ${totalDocPages}...`, progressPct);
  }

  onProgress?.(totalDocPages, totalDocPages, 'Serializing numbered PDF document...', 88);

  const savedBytes = await pdfDoc.save();

  onProgress?.(totalDocPages, totalDocPages, 'Verifying numbered PDF integrity...', 95);

  // Output validation
  await assertValidPdfOutput(savedBytes, {
    expectedPages: totalDocPages,
    minBytes: 64,
  });

  const blob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const finalName = sanitizeDownloadFilename(
    outputFileName || `${baseFileName}-numbered.pdf`,
    'numbered-document.pdf'
  );

  onProgress?.(totalDocPages, totalDocPages, 'Complete!', 100);

  return {
    blob,
    uint8Array: savedBytes,
    totalPages: totalDocPages,
    fileSize: blob.size,
    fileName: finalName,
  };
}

export const addPageNumbers = addPageNumbersToPdf;
