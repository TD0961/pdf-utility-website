/**
 * Dedicated JPG to PDF Engine
 * 100% in-browser image to PDF conversion using pdf-lib.
 * Directly embeds JPEG/PNG streams without lossy canvas recompression.
 * Supports configurable page sizes, orientations, margins, and aspect-ratio preservation.
 */

import { PDFDocument } from 'pdf-lib';
import { detectImageType, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { assertValidPdfOutput } from './output-validator';

export type PageSizeOption = 'auto' | 'fit' | 'a4' | 'letter' | 'legal';
export type OrientationOption = 'auto' | 'portrait' | 'landscape';
export type MarginOption = 'none' | 'small' | 'medium';
export type ImageFitOption = 'fit' | 'fill';

export interface JpgToPdfImageItem {
  name: string;
  buffer?: ArrayBuffer;
  file?: File;
  id?: string;
}

export interface JpgToPdfProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

export interface JpgToPdfOptions {
  images: (File | JpgToPdfImageItem)[];
  pageSize?: PageSizeOption | string;
  orientation?: OrientationOption;
  margin?: MarginOption;
  fit?: ImageFitOption;
  outputFileName?: string;
  onProgress?: JpgToPdfProgressCallback;
}

export interface JpgToPdfResult {
  blob: Blob;
  uint8Array: Uint8Array;
  bytes?: Uint8Array;
  pdfBytes?: Uint8Array;
  totalPages: number;
  fileSize: number;
  fileName: string;
}

// Standard page dimensions in PostScript points (72 points = 1 inch)
export const PAGE_DIMENSIONS: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
};

export const PAGE_SIZES = PAGE_DIMENSIONS;

const MARGIN_VALUES: Record<MarginOption, number> = {
  none: 0,
  small: 20,
  medium: 40,
};

/**
 * Converts an ordered list of JPEG (or PNG) images into a standardized PDF.
 */
export async function convertJpgToPdf({
  images,
  pageSize = 'a4',
  orientation = 'auto',
  margin = 'none',
  fit = 'fit',
  outputFileName = 'images-to-pdf.pdf',
  onProgress,
}: JpgToPdfOptions): Promise<JpgToPdfResult> {
  if (!images || images.length === 0) {
    throw new Error('Please select at least one image file to convert to PDF.');
  }

  const totalImages = images.length;
  onProgress?.(0, totalImages, 'Initializing PDF document container...', 5);

  const pdfDoc = await PDFDocument.create();
  const marginPt = MARGIN_VALUES[margin] ?? 0;

  for (let i = 0; i < totalImages; i++) {
    const item = images[i];
    let fileName = 'image.jpg';
    let arrayBuffer: ArrayBuffer;

    if (item instanceof File) {
      fileName = item.name;
      if (item.size === 0) {
        throw new Error(`Image "${fileName}" is empty (0 bytes).`);
      }
      arrayBuffer = await item.arrayBuffer();
    } else if (item.buffer) {
      fileName = item.name;
      arrayBuffer = item.buffer;
    } else if (item.file) {
      fileName = item.file.name;
      arrayBuffer = await item.file.arrayBuffer();
    } else {
      throw new Error(`Image item at index ${i + 1} has no valid data buffer.`);
    }

    const progressPct = 10 + Math.round(((i + 1) / totalImages) * 75);
    onProgress?.(
      i + 1,
      totalImages,
      `Processing image ${i + 1} of ${totalImages}: "${fileName}"...`,
      progressPct
    );

    const bytes = new Uint8Array(arrayBuffer);
    const imgType = detectImageType(bytes);

    let embeddedImage;
    try {
      if (imgType === 'jpeg') {
        embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
      } else if (imgType === 'png') {
        embeddedImage = await pdfDoc.embedPng(arrayBuffer);
      } else {
        // Fallback attempt with embedJpg
        try {
          embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
        } catch {
          embeddedImage = await pdfDoc.embedPng(arrayBuffer);
        }
      }
    } catch {
      throw new Error(
        `File "${fileName}" does not appear to be a valid JPEG or PNG image, or the image data is corrupted.`
      );
    }

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    // Determine target page dimensions
    let targetPageWidth: number;
    let targetPageHeight: number;

    if (pageSize === 'auto' || pageSize === 'fit' || !(pageSize in PAGE_DIMENSIONS)) {
      targetPageWidth = imgWidth + marginPt * 2;
      targetPageHeight = imgHeight + marginPt * 2;

      // Honor forced orientation if specified
      if (orientation === 'portrait' && targetPageWidth > targetPageHeight) {
        const tmp = targetPageWidth;
        targetPageWidth = targetPageHeight;
        targetPageHeight = tmp;
      } else if (orientation === 'landscape' && targetPageHeight > targetPageWidth) {
        const tmp = targetPageWidth;
        targetPageWidth = targetPageHeight;
        targetPageHeight = tmp;
      }
    } else {
      const [stdW, stdH] = PAGE_DIMENSIONS[pageSize];
      const isImgLandscape = imgWidth > imgHeight;

      if (orientation === 'auto') {
        // Match standard page orientation to image orientation
        if (isImgLandscape) {
          targetPageWidth = Math.max(stdW, stdH);
          targetPageHeight = Math.min(stdW, stdH);
        } else {
          targetPageWidth = Math.min(stdW, stdH);
          targetPageHeight = Math.max(stdW, stdH);
        }
      } else if (orientation === 'landscape') {
        targetPageWidth = Math.max(stdW, stdH);
        targetPageHeight = Math.min(stdW, stdH);
      } else {
        targetPageWidth = Math.min(stdW, stdH);
        targetPageHeight = Math.max(stdW, stdH);
      }
    }

    // Usable printable area inside margins
    const printableWidth = Math.max(1, targetPageWidth - marginPt * 2);
    const printableHeight = Math.max(1, targetPageHeight - marginPt * 2);

    let drawWidth = imgWidth;
    let drawHeight = imgHeight;
    let drawX = marginPt;
    let drawY = marginPt;

    if (fit === 'fit') {
      // Scale to fit while strictly preserving aspect ratio
      const widthRatio = printableWidth / imgWidth;
      const heightRatio = printableHeight / imgHeight;
      const scale = Math.min(widthRatio, heightRatio);

      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;

      // Center within printable area
      drawX = marginPt + (printableWidth - drawWidth) / 2;
      drawY = marginPt + (printableHeight - drawHeight) / 2;
    } else if (fit === 'fill') {
      // Fill entire printable area (may crop or fill bounds)
      const widthRatio = printableWidth / imgWidth;
      const heightRatio = printableHeight / imgHeight;
      const scale = Math.max(widthRatio, heightRatio);

      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;

      drawX = marginPt + (printableWidth - drawWidth) / 2;
      drawY = marginPt + (printableHeight - drawHeight) / 2;
    }

    const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);
    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  onProgress?.(totalImages, totalImages, 'Serializing generated PDF document...', 90);

  const pdfBytes = await pdfDoc.save();

  onProgress?.(totalImages, totalImages, 'Verifying generated PDF integrity...', 96);

  // Output Validation Gate
  await assertValidPdfOutput(pdfBytes, {
    expectedPages: totalImages,
    minBytes: 64,
  });

  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const sanitizedName = sanitizeDownloadFilename(outputFileName, 'images-to-pdf.pdf');

  onProgress?.(totalImages, totalImages, 'Complete!', 100);

  const result = Object.assign(pdfBytes, {
    blob,
    uint8Array: pdfBytes,
    pdfBytes,
    bytes: pdfBytes,
    totalPages: totalImages,
    fileSize: blob.size,
    fileName: sanitizedName,
  });

  return result as Uint8Array & JpgToPdfResult & { bytes: Uint8Array; pdfBytes: Uint8Array };
}

export const jpgToPdf = convertJpgToPdf;
