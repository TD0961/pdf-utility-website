/**
 * Dedicated Organize PDF Engine
 * Reorders, rotates, deletes, and duplicates pages 100% inside the user's browser.
 * Correctly accounts for pre-existing page rotation metadata.
 * Enforces output validation and prevents silent corruption.
 */

import { PDFDocument, degrees } from 'pdf-lib';
import { validatePdfMagicBytes, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { assertValidPdfOutput } from './output-validator';

export interface OrganizePageInstruction {
  id: string;
  originalIndex: number; // 0-based index in the source PDF
  rotation: number; // Additional user-requested rotation in degrees (0, 90, 180, 270)
  displayPageNumber?: number;
}

export interface OrganizeProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

export interface OrganizePdfOptions {
  file: File | { name: string; buffer: ArrayBuffer };
  pages: OrganizePageInstruction[];
  outputFileName?: string;
  onProgress?: OrganizeProgressCallback;
}

export interface OrganizePdfResult {
  blob: Blob;
  uint8Array: Uint8Array;
  totalPages: number;
  fileSize: number;
  fileName: string;
}

/**
 * Re-assembles a PDF document based on a list of page instructions.
 * Enforces that at least 1 page must remain.
 * Accurately combines existing /Rotate attributes with new rotation instructions.
 */
export async function organizePdfDocument({
  file,
  pages,
  outputFileName = 'organized-document.pdf',
  onProgress,
}: OrganizePdfOptions): Promise<OrganizePdfResult> {
  if (!pages || pages.length === 0) {
    throw new Error('A PDF must contain at least one page. Cannot save an empty document.');
  }

  let arrayBuffer: ArrayBuffer;
  let fileName = 'document.pdf';

  if (file instanceof File) {
    fileName = file.name;
    const validation = await validatePdfMagicBytes(file);
    if (!validation.valid) {
      throw new Error(`Invalid PDF document. ${validation.error || ''}`);
    }
    arrayBuffer = await file.arrayBuffer();
  } else {
    fileName = file.name;
    const validation = await validatePdfMagicBytes(file.buffer);
    if (!validation.valid) {
      throw new Error(`Invalid PDF document. ${validation.error || ''}`);
    }
    arrayBuffer = file.buffer;
  }

  onProgress?.(0, pages.length, 'Loading document structure...', 10);

  let sourceDoc: PDFDocument;
  try {
    sourceDoc = await PDFDocument.load(arrayBuffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (msg.includes('password') || msg.includes('encrypt')) {
      throw new Error(
        `"${fileName}" is password-protected. Please unlock it before organizing pages.`
      );
    }
    throw new Error(`Could not read "${fileName}". The file may be damaged, malformed, or encrypted.`);
  }

  const sourceTotalPages = sourceDoc.getPageCount();
  const newDoc = await PDFDocument.create();
  const totalInstructions = pages.length;

  for (let i = 0; i < totalInstructions; i++) {
    const instruction = pages[i];
    const srcIndex = instruction.originalIndex;

    if (srcIndex < 0 || srcIndex >= sourceTotalPages) {
      throw new Error(
        `Invalid page reference: index ${srcIndex} does not exist in source PDF of ${sourceTotalPages} pages.`
      );
    }

    const progressPct = 15 + Math.round(((i + 1) / totalInstructions) * 70);
    onProgress?.(
      i + 1,
      totalInstructions,
      `Arranging page ${i + 1} of ${totalInstructions}...`,
      progressPct
    );

    // Copy the specific page (handles duplication naturally if copied multiple times)
    const [copiedPage] = await newDoc.copyPages(sourceDoc, [srcIndex]);

    // Read existing page rotation and apply requested delta
    const existingRotation = copiedPage.getRotation().angle;
    const requestedDelta = instruction.rotation || 0;
    const effectiveRotation = ((existingRotation + requestedDelta) % 360 + 360) % 360;

    copiedPage.setRotation(degrees(effectiveRotation));
    newDoc.addPage(copiedPage);
  }

  onProgress?.(totalInstructions, totalInstructions, 'Serializing organized PDF...', 88);

  const savedBytes = await newDoc.save();

  onProgress?.(totalInstructions, totalInstructions, 'Verifying organized PDF integrity...', 95);

  // Output Validation Gate
  await assertValidPdfOutput(savedBytes, {
    expectedPages: totalInstructions,
    minBytes: 64,
  });

  const blob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const sanitizedName = sanitizeDownloadFilename(outputFileName, 'organized-document.pdf');

  onProgress?.(totalInstructions, totalInstructions, 'Complete!', 100);

  return {
    blob,
    uint8Array: savedBytes,
    totalPages: totalInstructions,
    fileSize: blob.size,
    fileName: sanitizedName,
  };
}
