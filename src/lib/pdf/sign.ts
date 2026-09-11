/**
 * iLikePDF — Client-Side Visual PDF Signature Engine
 * 100% in-browser visual signature placement using pdf-lib.
 * Adds visual signatures to selected pages without remote servers or cloud storage.
 * Mandatory notice: Visual signature only (not a cryptographic digital certificate).
 */

import { PDFDocument } from 'pdf-lib';
import { assertValidPdfOutput } from './output-validator';

export interface SignaturePlacement {
  pageIndex: number; // 0-based
  x: number;         // PDF points from left
  y: number;         // PDF points from bottom
  width: number;     // PDF points
  height: number;    // PDF points
}

export interface ApplySignatureOptions {
  signatureDataUrl: string;
  placement: SignaturePlacement;
}

export async function applyVisualSignature(
  pdfBytes: Uint8Array,
  options: ApplySignatureOptions
): Promise<{ bytes: Uint8Array; blob: Blob }> {
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('PDF file data is empty.');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  const { pageIndex, x, y, width, height } = options.placement;

  if (pageIndex < 0 || pageIndex >= totalPages) {
    throw new Error(`Target page index ${pageIndex} is out of bounds (document has ${totalPages} pages).`);
  }

  const page = pdfDoc.getPage(pageIndex);
  const pageSize = page.getSize();

  // Convert base64 dataUrl to bytes
  const base64Data = options.signatureDataUrl.split(',')[1];
  if (!base64Data) {
    throw new Error('Invalid signature image data.');
  }

  const binaryString = atob(base64Data);
  const imageBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    imageBytes[i] = binaryString.charCodeAt(i);
  }

  // Embed PNG or JPG depending on header
  let embeddedImage;
  if (options.signatureDataUrl.startsWith('data:image/jpeg') || options.signatureDataUrl.startsWith('data:image/jpg')) {
    embeddedImage = await pdfDoc.embedJpg(imageBytes);
  } else {
    embeddedImage = await pdfDoc.embedPng(imageBytes);
  }

  // Draw signature onto target page
  // Ensure coordinates remain within page bounds
  const clampedX = Math.max(0, Math.min(pageSize.width - width, x));
  const clampedY = Math.max(0, Math.min(pageSize.height - height, y));

  page.drawImage(embeddedImage, {
    x: clampedX,
    y: clampedY,
    width,
    height,
  });

  const outputBytes = await pdfDoc.save({ useObjectStreams: true });
  await assertValidPdfOutput(outputBytes, { expectedPages: totalPages });

  const blob = new Blob([outputBytes as BlobPart], { type: 'application/pdf' });
  return { bytes: outputBytes, blob };
}
