/**
 * Dedicated PDF to JPG Engine
 * 100% in-browser PDF page rendering to high-quality JPEG images.
 * Uses bounded incremental rendering (page-by-page) to minimize memory pressure.
 * Supports page range selection, quality scaling, and zero-padded ZIP archiving.
 */

import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { validatePdfMagicBytes, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { parsePageRanges } from './range-parser';
import { validateJpgOutput, assertValidZipContainsJpgs } from './output-validator';
import { getPdfJs } from './pdf-renderer';

interface PdfJsPage {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    canvas: HTMLCanvasElement;
  }) => { promise: Promise<void> };
  cleanup: () => Promise<void>;
}

interface PdfJsDoc {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
  cleanup: () => Promise<void>;
}

interface PdfJsLoadingTask {
  promise: Promise<PdfJsDoc>;
  destroy: () => Promise<void>;
}

export type JpgQuality = 'standard' | 'high' | 'very-high';

export interface PdfToJpgProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

export interface PdfToJpgOptions {
  file: File | { name: string; buffer: ArrayBuffer };
  pages?: 'all' | string; // 'all' or custom range expression like "1-3, 5"
  quality?: JpgQuality; // 'standard' (1.5x), 'high' (2.0x), 'very-high' (3.0x)
  outputFileName?: string;
  onProgress?: PdfToJpgProgressCallback;
  renderPageOverride?: (pageNumber: number, scale: number) => Promise<Uint8Array>; // For headless test environments
}

export interface JpgOutputFile {
  name: string;
  bytes: Uint8Array;
  pageNumber: number;
}

export interface PdfToJpgResult {
  blob: Blob;
  fileName: string;
  isZip: boolean;
  pageCount: number;
  outputFiles: JpgOutputFile[];
}

const QUALITY_SCALES: Record<JpgQuality, number> = {
  standard: 1.5, // ~108 DPI
  high: 2.0,     // ~144 DPI
  'very-high': 3.0, // ~216 DPI
};

/**
 * Converts a data URL into a Uint8Array byte buffer
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts selected PDF pages into high-resolution JPG files.
 */
export async function convertPdfToJpg({
  file,
  pages = 'all',
  quality = 'high',
  outputFileName,
  onProgress,
  renderPageOverride,
}: PdfToJpgOptions): Promise<PdfToJpgResult> {
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

  onProgress?.(0, 10, 'Loading PDF document...', 5);

  let totalDocPages = 0;
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    if (pdfDoc.isEncrypted) {
      throw new Error('This PDF is password-protected. Please unlock it before converting to JPG.');
    }
    totalDocPages = pdfDoc.getPageCount();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (msg.includes('password') || msg.includes('encrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before converting to JPG.');
    }
    throw new Error('Could not parse PDF. The file may be damaged or corrupted.');
  }

  if (totalDocPages === 0) {
    throw new Error('This PDF contains zero pages.');
  }

  let doc: PdfJsDoc | null = null;
  let loadingTask: PdfJsLoadingTask | null = null;

  if (!renderPageOverride) {
    const pdfjs = await getPdfJs();
    loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }) as unknown as PdfJsLoadingTask;
    doc = await loadingTask.promise;
  }

  // Determine which pages to convert (1-based indices)
  let targetPageNumbers: number[] = [];

  if (pages === 'all') {
    targetPageNumbers = Array.from({ length: totalDocPages }, (_, i) => i + 1);
  } else {
    const rangeResult = parsePageRanges(pages, totalDocPages);
    if (!rangeResult.valid) {
      throw new Error(rangeResult.error || 'Invalid page range for this PDF.');
    }
    targetPageNumbers = rangeResult.allPageIndices.map((idx) => idx + 1);
  }

  if (targetPageNumbers.length === 0) {
    throw new Error('No pages were selected for conversion.');
  }

  const scale = QUALITY_SCALES[quality] ?? 2.0;
  const totalToConvert = targetPageNumbers.length;
  const outputFiles: JpgOutputFile[] = [];
  const zip = new JSZip();

  try {
    for (let i = 0; i < totalToConvert; i++) {
      const pageNum = targetPageNumbers[i];
      const progressPct = 10 + Math.round(((i + 1) / totalToConvert) * 75);

      onProgress?.(
        i + 1,
        totalToConvert,
        `Converting page ${pageNum} (${i + 1} of ${totalToConvert})...`,
        progressPct
      );

      let jpgBytes: Uint8Array;

      if (renderPageOverride) {
        jpgBytes = await renderPageOverride(pageNum, scale);
      } else {
        if (!doc) throw new Error('PDF document could not be loaded.');
        const page = await doc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        if (typeof document === 'undefined') {
          throw new Error('Canvas rendering requires a browser environment.');
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to acquire 2D canvas rendering context.');

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        jpgBytes = dataUrlToUint8Array(dataUrl);

        // Immediate cleanup of canvas resources
        canvas.width = 0;
        canvas.height = 0;
        await page.cleanup();
      }

      // Output Validation Gate for single JPEG
      const validationReport = validateJpgOutput(jpgBytes);
      if (!validationReport.valid) {
        throw new Error(`Failed to generate valid JPEG for page ${pageNum}: ${validationReport.error}`);
      }

      // Format zero-padded filename: e.g. document-page-001.jpg
      const paddedNum = String(pageNum).padStart(3, '0');
      const pageFileName = `${baseFileName}-page-${paddedNum}.jpg`;

      outputFiles.push({
        name: pageFileName,
        bytes: jpgBytes,
        pageNumber: pageNum,
      });

      zip.file(pageFileName, jpgBytes);
    }
  } finally {
    if (doc) {
      await doc.cleanup();
    }
    if (loadingTask) {
      await loadingTask.destroy();
    }
  }

  // If only 1 page was converted, return direct single JPG
  if (outputFiles.length === 1) {
    const single = outputFiles[0];
    const blob = new Blob([single.bytes.buffer as ArrayBuffer], { type: 'image/jpeg' });
    const defaultName = single.name;
    const finalName = sanitizeDownloadFilename(outputFileName || defaultName, defaultName);

    onProgress?.(1, 1, 'Conversion complete!', 100);

    return {
      blob,
      fileName: finalName,
      isZip: false,
      pageCount: 1,
      outputFiles,
    };
  }

  // Multiple pages: package into ZIP
  onProgress?.(totalToConvert, totalToConvert, 'Packaging images into ZIP archive...', 90);
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  onProgress?.(totalToConvert, totalToConvert, 'Verifying ZIP archive integrity...', 95);

  // Validate ZIP integrity
  await assertValidZipContainsJpgs(zipBlob, totalToConvert);

  const defaultZipName = `${baseFileName}-pages.zip`;
  const finalZipName = sanitizeDownloadFilename(outputFileName || defaultZipName, defaultZipName);

  onProgress?.(totalToConvert, totalToConvert, 'Conversion complete!', 100);

  return {
    blob: zipBlob,
    fileName: finalZipName,
    isZip: true,
    pageCount: totalToConvert,
    outputFiles,
  };
}
