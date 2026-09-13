/**
 * PDFSimplify — Client-Side Visual PDF Crop Engine
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

export interface CropMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface CropPdfOptions {
  cropBox?: CropBoxPoints;
  margins?: CropMargins;
  scope?: CropScope;
  mode?: CropScope;
  currentPageIndex?: number; // 0-based
  customPageIndices?: number[]; // 0-based
}

/**
 * Crops specified pages of a PDF document using native PDF CropBox boundaries.
 */
export async function cropPdfDocument(
  pdfBytes: Uint8Array,
  options: CropPdfOptions
): Promise<{ bytes: Uint8Array; blob: Blob; pdfBytes: Uint8Array; uint8Array: Uint8Array }> {
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('PDF file is empty.');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  const scope: CropScope = options.scope || options.mode || 'all';
  const currentPageIndex = options.currentPageIndex ?? 0;
  const customPageIndices = options.customPageIndices;

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

    let box: CropBoxPoints;
    if (options.margins) {
      const { top = 0, bottom = 0, left = 0, right = 0 } = options.margins;
      box = {
        x: mediaBox.x + left,
        y: mediaBox.y + bottom,
        width: Math.max(5, mediaBox.width - left - right),
        height: Math.max(5, mediaBox.height - top - bottom),
      };
    } else if (options.cropBox) {
      if (options.cropBox.width <= 5 || options.cropBox.height <= 5) {
        throw new Error('Crop rectangle dimensions are too small (minimum 5 points).');
      }
      box = options.cropBox;
    } else {
      throw new Error('Either cropBox or margins must be provided to crop PDF.');
    }

    // Clamp coordinates to page MediaBox
    const clampedX = Math.max(mediaBox.x, Math.min(mediaBox.x + mediaBox.width - 5, box.x));
    const clampedY = Math.max(mediaBox.y, Math.min(mediaBox.y + mediaBox.height - 5, box.y));
    const clampedWidth = Math.min(mediaBox.width - (clampedX - mediaBox.x), box.width);
    const clampedHeight = Math.min(mediaBox.height - (clampedY - mediaBox.y), box.height);

    if (clampedWidth > 0 && clampedHeight > 0) {
      page.setCropBox(clampedX, clampedY, clampedWidth, clampedHeight);
      page.setMediaBox(clampedX, clampedY, clampedWidth, clampedHeight);
    }
  }

  const outBytes = await pdfDoc.save({ useObjectStreams: true });
  await assertValidPdfOutput(outBytes, { expectedPages: totalPages });

  const blob = new Blob([outBytes as BlobPart], { type: 'application/pdf' });
  const result = Object.assign(outBytes, {
    bytes: outBytes,
    pdfBytes: outBytes,
    uint8Array: outBytes,
    blob,
  });

  return result as Uint8Array & {
    bytes: Uint8Array;
    pdfBytes: Uint8Array;
    uint8Array: Uint8Array;
    blob: Blob;
  };
}
