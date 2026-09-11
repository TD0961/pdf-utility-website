/**
 * iLikePDF — Client-Side Visual PDF Crop Engine
 * Real in-browser visual page cropping using pdf-lib setCropBox.
 * Transforms screen coordinates to PDF points and applies valid page bounding boxes.
 * Zero backend.
 */

import { PDFDocument } from 'pdf-lib';
import { assertValidPdfOutput } from './output-validator';

export interface CropBoxPoints {
  x: number;      // PDF points from left
  y: number;      // PDF points from bottom
  width: number;  // PDF points
  height: number; // PDF points
}

export type CropScope = 'current' | 'all' | 'custom';

export interface CropPdfOptions {
  cropBox: CropBoxPoints;
  scope: CropScope;
  currentPageIndex: number; // 0-based
  customPageIndices?: number[]; // 0-based
}

/**
 * Crops specified pages of a PDF document using native PDF CropBox boundaries.
 */
export async function cropPdfDocument(
  pdfBytes: Uint8Array,
  options: CropPdfOptions
): Promise<{ bytes: Uint8Array; blob: Blob }> {
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('PDF file is empty.');
  }

  const { cropBox, scope, currentPageIndex, customPageIndices } = options;

  if (cropBox.width <= 5 || cropBox.height <= 5) {
    throw new Error('Crop rectangle dimensions are too small (minimum 5 points).');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  let targetIndices: number[] = [];

  if (scope === 'current') {
    targetIndices = [currentPageIndex];
  } else if (scope === 'all') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i);
  } else if (scope === 'custom' && customPageIndices && customPageIndices.length > 0) {
    targetIndices = customPageIndices.filter((idx) => idx >= 0 && idx < totalPages);
  }

  if (targetIndices.length === 0) {
    targetIndices = [currentPageIndex];
  }

  for (const pageIndex of targetIndices) {
    const page = pdfDoc.getPage(pageIndex);
    const mediaBox = page.getMediaBox();

    // Clamp coordinates to page MediaBox
    const clampedX = Math.max(mediaBox.x, Math.min(mediaBox.x + mediaBox.width - 5, cropBox.x));
    const clampedY = Math.max(mediaBox.y, Math.min(mediaBox.y + mediaBox.height - 5, cropBox.y));
    const clampedWidth = Math.min(mediaBox.width - (clampedX - mediaBox.x), cropBox.width);
    const clampedHeight = Math.min(mediaBox.height - (clampedY - mediaBox.y), cropBox.height);

    if (clampedWidth > 0 && clampedHeight > 0) {
      page.setCropBox(clampedX, clampedY, clampedWidth, clampedHeight);
    }
  }

  const outBytes = await pdfDoc.save({ useObjectStreams: true });
  await assertValidPdfOutput(outBytes, { expectedPages: totalPages });

  return {
    bytes: outBytes,
    blob: new Blob([outBytes as BlobPart], { type: 'application/pdf' }),
  };
}
