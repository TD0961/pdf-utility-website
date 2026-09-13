/**
 * Dedicated Merge PDF Engine
 * 100% in-browser document combination using pdf-lib.
 * Preserves vector graphics, fonts, text, images, rotations, and mixed page sizes.
 * Never rasterizes pages into images.
 * Enforces output validation and strict duplicate-file preservation.
 */

import { PDFDocument } from 'pdf-lib';
import { validatePdfMagicBytes, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { assertValidPdfOutput } from './output-validator';

export interface MergeProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

export interface MergeInputFile {
  name: string;
  buffer?: ArrayBuffer;
  id?: string;
}

export interface MergePdfOptions {
  files: (File | MergeInputFile)[];
  onProgress?: MergeProgressCallback;
  outputFileName?: string;
}

export interface MergePdfResult {
  blob: Blob;
  uint8Array: Uint8Array;
  totalPages: number;
  fileSize: number;
  fileCount: number;
  fileName: string;
}

/**
 * Merges multiple PDF files into a single consolidated PDF document.
 * Requires at least 2 input files.
 * Preserves file sequence and allows multiple identical files without deduplication.
 */
export async function mergePdfFiles({
  files,
  onProgress,
  outputFileName = 'merged-document.pdf',
}: MergePdfOptions): Promise<MergePdfResult> {
  if (!files || files.length < 2) {
    throw new Error('At least 2 PDF files are required to merge.');
  }

  const totalFiles = files.length;
  onProgress?.(0, totalFiles, 'Initializing document merger...', 5);

  const mergedDoc = await PDFDocument.create();
  let expectedTotalPages = 0;

  for (let i = 0; i < totalFiles; i++) {
    const fileItem = files[i];
    const fileName = fileItem.name;
    const progressPct = 10 + Math.round(((i + 1) / totalFiles) * 75);

    onProgress?.(
      i + 1,
      totalFiles,
      `Loading and combining document ${i + 1} of ${totalFiles}: "${fileName}"...`,
      progressPct
    );

    let arrayBuffer: ArrayBuffer;
    if (fileItem instanceof File) {
      // Validate magic bytes client-side
      const validation = await validatePdfMagicBytes(fileItem);
      if (!validation.valid) {
        throw new Error(
          `Could not parse "${fileItem.name}". ${validation.error || 'The file is not a valid PDF document.'}`
        );
      }
      arrayBuffer = await fileItem.arrayBuffer();
    } else if (fileItem.buffer) {
      const validation = await validatePdfMagicBytes(fileItem.buffer);
      if (!validation.valid) {
        throw new Error(
          `Could not parse "${fileName}". ${validation.error || 'The file is not a valid PDF document.'}`
        );
      }
      arrayBuffer = fileItem.buffer;
    } else {
      throw new Error(`Could not parse "${fileName}". No readable data buffer was provided.`);
    }

    let sourceDoc: PDFDocument;
    try {
      // Attempt strict load to catch password-protected/encrypted PDFs safely
      sourceDoc = await PDFDocument.load(arrayBuffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      if (msg.includes('password') || msg.includes('encrypt')) {
        throw new Error(
          `"${fileName}" is password-protected. Please unlock it before merging.`
        );
      }
      throw new Error(`Could not parse "${fileName}". The file may be damaged, malformed, or encrypted.`);
    }

    const pageCount = sourceDoc.getPageCount();
    if (pageCount === 0) {
      continue; // Skip empty documents if any
    }

    // Copy original page structures (preserves vectors, fonts, images, dimensions, rotations)
    const copiedPages = await mergedDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());

    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }

    expectedTotalPages += pageCount;
  }

  if (expectedTotalPages === 0) {
    throw new Error('The selected PDF documents contained zero pages in total.');
  }

  onProgress?.(totalFiles, totalFiles, 'Serializing merged PDF document...', 88);

  const mergedPdfBytes = await mergedDoc.save();

  onProgress?.(totalFiles, totalFiles, 'Verifying merged PDF integrity...', 95);

  // Output Validation Gate: Re-parse and verify output before presenting to user
  await assertValidPdfOutput(mergedPdfBytes, {
    expectedPages: expectedTotalPages,
    minBytes: 64,
  });

  const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const sanitizedName = sanitizeDownloadFilename(outputFileName, 'merged-document.pdf');

  onProgress?.(totalFiles, totalFiles, 'Complete!', 100);

  return {
    blob,
    uint8Array: mergedPdfBytes,
    totalPages: expectedTotalPages,
    fileSize: blob.size,
    fileCount: totalFiles,
    fileName: sanitizedName,
  };
}

export const mergePdf = mergePdfFiles;
