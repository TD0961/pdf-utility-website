/**
 * Dedicated Rotate PDF Engine
 * 100% in-browser PDF page rotation using pdf-lib.
 * Applies cumulative rotation: newRotation = ((existingRotation + requestedDelta) % 360 + 360) % 360.
 * Preserves text, fonts, annotations, vectors, and bookmarks without rasterization.
 */

import { PDFDocument, degrees } from 'pdf-lib';
import { validatePdfMagicBytes, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { assertValidPdfOutput } from './output-validator';

export interface PageRotationInstruction {
  pageIndex: number; // 0-based page index
  deltaRotation: number; // degrees to rotate: 90, 180, 270, -90, etc.
}

export interface RotateProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

export interface RotatePdfOptions {
  file: File | { name: string; buffer: ArrayBuffer };
  rotations?: PageRotationInstruction[];
  allPagesDelta?: number; // Shortcut to rotate all pages by delta degrees
  outputFileName?: string;
  onProgress?: RotateProgressCallback;
}

export interface RotatePdfResult {
  blob: Blob;
  uint8Array: Uint8Array;
  totalPages: number;
  fileSize: number;
  fileName: string;
}

/**
 * Rotates specific or all pages within a PDF document using cumulative rotation.
 */
export async function rotatePdfDocument({
  file,
  rotations = [],
  allPagesDelta = 0,
  outputFileName,
  onProgress,
}: RotatePdfOptions): Promise<RotatePdfResult> {
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

  onProgress?.(0, 10, 'Loading PDF document structure...', 10);

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    if (pdfDoc.isEncrypted) {
      throw new Error('This PDF is password-protected. Please unlock it before rotating pages.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (msg.includes('password') || msg.includes('encrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before rotating pages.');
    }
    throw new Error('Could not parse PDF. The file may be damaged or corrupted.');
  }

  const totalPages = pdfDoc.getPageCount();
  if (totalPages === 0) {
    throw new Error('This PDF contains zero pages.');
  }

  // Create a fast lookup map for per-page rotation deltas
  const deltaMap = new Map<number, number>();
  for (const item of rotations) {
    if (item.pageIndex >= 0 && item.pageIndex < totalPages) {
      const current = deltaMap.get(item.pageIndex) || 0;
      deltaMap.set(item.pageIndex, current + item.deltaRotation);
    }
  }

  // Apply rotation to each page
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const existingAngle = page.getRotation().angle;
    const pageDelta = deltaMap.get(i) ?? allPagesDelta;

    if (pageDelta !== 0) {
      const effectiveRotation = ((existingAngle + pageDelta) % 360 + 360) % 360;
      page.setRotation(degrees(effectiveRotation));
    }

    const progressPct = 15 + Math.round(((i + 1) / totalPages) * 70);
    onProgress?.(i + 1, totalPages, `Rotating page ${i + 1} of ${totalPages}...`, progressPct);
  }

  onProgress?.(totalPages, totalPages, 'Saving rotated PDF document...', 88);

  const savedBytes = await pdfDoc.save();

  onProgress?.(totalPages, totalPages, 'Verifying rotated PDF integrity...', 95);

  // Output validation
  await assertValidPdfOutput(savedBytes, {
    expectedPages: totalPages,
    minBytes: 64,
  });

  const blob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const finalName = sanitizeDownloadFilename(
    outputFileName || `${baseFileName}-rotated.pdf`,
    'rotated-document.pdf'
  );

  onProgress?.(totalPages, totalPages, 'Complete!', 100);

  return {
    blob,
    uint8Array: savedBytes,
    totalPages,
    fileSize: blob.size,
    fileName: finalName,
  };
}

export const rotatePdf = rotatePdfDocument;
