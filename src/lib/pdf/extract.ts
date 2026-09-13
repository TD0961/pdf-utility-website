/**
 * Dedicated Extract Pages Engine
 * 100% in-browser extraction of selected pages into a standalone PDF.
 * Preserves exact user-defined page sequence without unprompted re-sorting.
 * Preserves vector elements, high-resolution raster images, fonts, and dimensions.
 */

import { PDFDocument } from 'pdf-lib';
import { validatePdfMagicBytes, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { parsePageRanges } from './range-parser';
import { assertValidPdfOutput } from './output-validator';

export interface ExtractProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

export interface ExtractPdfOptions {
  file: File | { name: string; buffer: ArrayBuffer };
  pageIndices?: number[]; // 0-based page indices (preserves exact order)
  rangeExpression?: string; // Optional range syntax e.g. "1-3, 5"
  outputFileName?: string;
  onProgress?: ExtractProgressCallback;
}

export interface ExtractPdfResult {
  blob: Blob;
  uint8Array: Uint8Array;
  totalPages: number;
  fileSize: number;
  fileName: string;
}

/**
 * Extracts a subset of pages from a PDF document into a fresh PDF file.
 */
export async function extractPdfPages({
  file,
  pageIndices,
  rangeExpression,
  outputFileName,
  onProgress,
}: ExtractPdfOptions): Promise<ExtractPdfResult> {
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

  onProgress?.(0, 10, 'Loading source PDF document...', 10);

  let sourceDoc: PDFDocument;
  try {
    sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    if (sourceDoc.isEncrypted) {
      throw new Error('This PDF is password-protected. Please unlock it before extracting pages.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (msg.includes('password') || msg.includes('encrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before extracting pages.');
    }
    throw new Error('Could not parse PDF. The file may be damaged or corrupted.');
  }

  const totalOriginalPages = sourceDoc.getPageCount();
  if (totalOriginalPages === 0) {
    throw new Error('This PDF contains zero pages.');
  }

  // Determine target indices
  let targetIndices: number[] = [];

  if (pageIndices && pageIndices.length > 0) {
    targetIndices = [...pageIndices];
  } else if (rangeExpression && rangeExpression.trim().length > 0) {
    const rangeResult = parsePageRanges(rangeExpression, totalOriginalPages);
    if (!rangeResult.valid) {
      throw new Error(rangeResult.error || 'Invalid page range specified.');
    }
    targetIndices = rangeResult.allPageIndices;
  }

  if (targetIndices.length === 0) {
    throw new Error('Please select at least one page to extract.');
  }

  // Verify bounds for all selected indices
  for (const idx of targetIndices) {
    if (idx < 0 || idx >= totalOriginalPages) {
      throw new Error(
        `Selected page ${idx + 1} is out of range and does not exist in this PDF. The document only has ${totalOriginalPages} pages.`
      );
    }
  }

  const totalToExtract = targetIndices.length;
  onProgress?.(0, totalToExtract, 'Copying selected pages...', 30);

  const newDoc = await PDFDocument.create();

  // Copy pages in the exact user-specified order
  const copiedPages = await newDoc.copyPages(sourceDoc, targetIndices);
  for (let i = 0; i < copiedPages.length; i++) {
    newDoc.addPage(copiedPages[i]);
    const progressPct = 30 + Math.round(((i + 1) / totalToExtract) * 50);
    onProgress?.(i + 1, totalToExtract, `Assembling page ${i + 1} of ${totalToExtract}...`, progressPct);
  }

  onProgress?.(totalToExtract, totalToExtract, 'Generating extracted PDF document...', 85);

  const savedBytes = await newDoc.save();

  onProgress?.(totalToExtract, totalToExtract, 'Verifying extracted document integrity...', 95);

  // Output validation
  await assertValidPdfOutput(savedBytes, {
    expectedPages: totalToExtract,
    minBytes: 64,
  });

  const blob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const finalName = sanitizeDownloadFilename(
    outputFileName || `${baseFileName}-extracted.pdf`,
    'extracted-pages.pdf'
  );

  onProgress?.(totalToExtract, totalToExtract, 'Complete!', 100);

  return {
    blob,
    uint8Array: savedBytes,
    totalPages: totalToExtract,
    fileSize: blob.size,
    fileName: finalName,
  };
}

export const extractPages = extractPdfPages;
