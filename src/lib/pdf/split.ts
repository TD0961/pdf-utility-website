/**
 * Dedicated Split PDF Engine
 * Supports Extract Selected Pages, Split Every Page, and Split by Ranges with JSZip.
 * Preserves vector graphics, text, embedded resources, and dimensions.
 * Enforces output validation for both single PDFs and packaged ZIP archives.
 */

import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { validatePdfMagicBytes, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { parsePageRanges, ParsedRangeGroup } from './range-parser';
import { assertValidPdfOutput, assertValidZipOutput } from './output-validator';

export type SplitMode = 'extract' | 'every-page' | 'ranges';

export interface SplitProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

export interface SplitPdfOptions {
  file: File | { name: string; buffer: ArrayBuffer };
  mode: SplitMode;
  selectedPages?: number[]; // 0-based indices for 'extract' mode (preserves order)
  rangeExpression?: string; // e.g. "1-5, 8, 11-14" for 'ranges' mode
  onProgress?: SplitProgressCallback;
}

export interface SplitOutputFile {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
}

export interface SplitPdfResult {
  blob: Blob;
  fileName: string;
  isZip: boolean;
  fileCount: number;
  totalOriginalPages: number;
  outputFiles: SplitOutputFile[];
}

/**
 * Executes PDF splitting according to the selected mode.
 * Enforces output validation before returning any result.
 */
export async function splitPdfDocument({
  file,
  mode,
  selectedPages = [],
  rangeExpression = '',
  onProgress,
}: SplitPdfOptions): Promise<SplitPdfResult> {
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
    sourceDoc = await PDFDocument.load(arrayBuffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (msg.includes('password') || msg.includes('encrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before splitting.');
    }
    throw new Error('Could not parse PDF. The file may be damaged, malformed, or encrypted.');
  }

  const totalPages = sourceDoc.getPageCount();
  if (totalPages === 0) {
    throw new Error('This PDF contains zero pages.');
  }

  // --- MODE A: EXTRACT SELECTED PAGES INTO A SINGLE PDF ---
  // Intentionally preserves the exact ordering provided in selectedPages
  if (mode === 'extract') {
    if (!selectedPages || selectedPages.length === 0) {
      throw new Error('Please select at least one page to extract.');
    }

    onProgress?.(1, 1, 'Extracting selected pages...', 50);

    const newDoc = await PDFDocument.create();
    const validIndices = selectedPages.filter((idx) => idx >= 0 && idx < totalPages);

    if (validIndices.length === 0) {
      throw new Error('Selected pages are out of range for this document.');
    }

    const copiedPages = await newDoc.copyPages(sourceDoc, validIndices);
    for (const page of copiedPages) {
      newDoc.addPage(page);
    }

    const bytes = await newDoc.save();

    // Output validation
    await assertValidPdfOutput(bytes, {
      expectedPages: validIndices.length,
      minBytes: 64,
    });

    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const outputName = sanitizeDownloadFilename(`${baseFileName}-extracted.pdf`);

    onProgress?.(1, 1, 'Extraction complete!', 100);

    return {
      blob,
      fileName: outputName,
      isZip: false,
      fileCount: 1,
      totalOriginalPages: totalPages,
      outputFiles: [{ name: outputName, bytes, pageCount: validIndices.length }],
    };
  }

  // --- MODE B: SPLIT EVERY PAGE INTO STANDALONE PDFS ---
  if (mode === 'every-page') {
    const outputFiles: SplitOutputFile[] = [];
    const zip = new JSZip();

    for (let i = 0; i < totalPages; i++) {
      const progressPct = 15 + Math.round(((i + 1) / totalPages) * 70);
      onProgress?.(
        i + 1,
        totalPages,
        `Splitting page ${i + 1} of ${totalPages}...`,
        progressPct
      );

      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(sourceDoc, [i]);
      singleDoc.addPage(copiedPage);

      const bytes = await singleDoc.save();

      // Validate each page PDF
      await assertValidPdfOutput(bytes, {
        expectedPages: 1,
        minBytes: 32,
      });

      const pageFileName = sanitizeDownloadFilename(`${baseFileName}-page-${i + 1}.pdf`);

      outputFiles.push({ name: pageFileName, bytes, pageCount: 1 });
      zip.file(pageFileName, bytes);
    }

    onProgress?.(totalPages, totalPages, 'Packaging files into ZIP archive...', 88);
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    onProgress?.(totalPages, totalPages, 'Verifying ZIP archive integrity...', 95);

    // Validate ZIP integrity and contained PDFs
    await assertValidZipOutput(zipBlob, totalPages);

    const zipFileName = sanitizeDownloadFilename(`${baseFileName}-split-pages.zip`, 'split-pages.zip');
    onProgress?.(totalPages, totalPages, 'Split complete!', 100);

    return {
      blob: zipBlob,
      fileName: zipFileName,
      isZip: true,
      fileCount: totalPages,
      totalOriginalPages: totalPages,
      outputFiles,
    };
  }

  // --- MODE C: SPLIT BY RANGES ---
  // Handles overlapping ranges deterministically (each range group contains its requested pages)
  if (mode === 'ranges') {
    const parseResult = parsePageRanges(rangeExpression, totalPages);
    if (!parseResult.valid) {
      throw new Error(parseResult.error || 'Invalid range expression.');
    }

    const groups: ParsedRangeGroup[] = parseResult.groups;
    if (groups.length === 0) {
      throw new Error('No valid range groups identified.');
    }

    const outputFiles: SplitOutputFile[] = [];

    for (let g = 0; g < groups.length; g++) {
      const group = groups[g];
      const progressPct = 15 + Math.round(((g + 1) / groups.length) * 70);
      onProgress?.(
        g + 1,
        groups.length,
        `Creating range file ${g + 1} of ${groups.length} (${group.label})...`,
        progressPct
      );

      const rangeDoc = await PDFDocument.create();
      const copiedPages = await rangeDoc.copyPages(sourceDoc, group.pageIndices);
      for (const page of copiedPages) {
        rangeDoc.addPage(page);
      }

      const bytes = await rangeDoc.save();

      // Validate each range PDF
      await assertValidPdfOutput(bytes, {
        expectedPages: group.pageIndices.length,
        minBytes: 64,
      });

      const rangeFileName = sanitizeDownloadFilename(`${baseFileName}-${group.label}.pdf`);
      outputFiles.push({ name: rangeFileName, bytes, pageCount: group.pageIndices.length });
    }

    // If only one range was created, return directly as a single PDF
    if (outputFiles.length === 1) {
      const single = outputFiles[0];
      const blob = new Blob([single.bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      onProgress?.(1, 1, 'Split complete!', 100);

      return {
        blob,
        fileName: single.name,
        isZip: false,
        fileCount: 1,
        totalOriginalPages: totalPages,
        outputFiles,
      };
    }

    // Otherwise package into ZIP
    onProgress?.(groups.length, groups.length, 'Packaging ranges into ZIP archive...', 88);
    const zip = new JSZip();
    for (const file of outputFiles) {
      zip.file(file.name, file.bytes);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    onProgress?.(groups.length, groups.length, 'Verifying ZIP archive integrity...', 95);

    // Validate ZIP integrity
    await assertValidZipOutput(zipBlob, groups.length);

    const zipFileName = sanitizeDownloadFilename(`${baseFileName}-split-ranges.zip`, 'split-ranges.zip');
    onProgress?.(groups.length, groups.length, 'Split complete!', 100);

    return {
      blob: zipBlob,
      fileName: zipFileName,
      isZip: true,
      fileCount: outputFiles.length,
      totalOriginalPages: totalPages,
      outputFiles,
    };
  }

  throw new Error(`Unsupported split mode: "${mode}"`);
}
