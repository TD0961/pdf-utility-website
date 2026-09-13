/**
 * PDFSimplify — Zero-Backend Document Conversion Engine
 * High-level orchestration for client-side PDF to Word (.docx) and PDF to PowerPoint (.pptx).
 * Handles coordinate analysis, OpenXML packaging, progress reporting, cancellation, and validation.
 */

import JSZip from 'jszip';
import { analyzePdfDocument } from './layout/page-analyzer';
import { buildDocxFromLayout } from './docx-builder';
import { buildPptxFromLayout } from './pptx-builder';
import {
  ConversionOptions,
  ConversionResult,
  ConversionProgress,
  CancellationToken,
} from './types';

/**
 * Derives a deterministic output filename replacing .pdf with target extension
 */
export function deriveOutputFilename(sourceName: string, targetExt: string): string {
  const cleanName = (sourceName || 'document')
    .replace(/[^\w.-]/g, '_')
    .replace(/\.pdf$/i, '');
  const ext = targetExt.startsWith('.') ? targetExt : `.${targetExt}`;
  return `${cleanName}${ext}`;
}

/**
 * Creates a cooperative cancellation token
 */
export function createCancellationToken(): CancellationToken {
  let cancelled = false;
  return {
    get isCancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  };
}

/**
 * Verifies that a generated OpenXML ZIP package contains standard required parts
 */
export async function validateOpenXmlPackage(bytes: Uint8Array, requiredMainPart: string): Promise<boolean> {
  if (!bytes || bytes.length < 100) {
    return false;
  }

  // Check standard PK\x03\x04 zip header magic bytes
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    return false;
  }

  try {
    const zip = await JSZip.loadAsync(bytes);
    const hasContentTypes = Boolean(zip.file('[Content_Types].xml'));
    const hasRels = Boolean(zip.file('_rels/.rels'));
    const hasMainPart = Boolean(zip.file(requiredMainPart));

    return hasContentTypes && hasRels && hasMainPart;
  } catch {
    return false;
  }
}

/**
 * Converts a PDF document into an editable Microsoft Word (.docx) file
 */
export async function convertPdfToWord(
  fileOrData: File | { name: string; buffer: ArrayBuffer },
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const startTime = Date.now();
  const fileName = fileOrData instanceof File ? fileOrData.name : fileOrData.name;
  const buffer = fileOrData instanceof File ? await fileOrData.arrayBuffer() : fileOrData.buffer;

  const notifyProgress = (progress: ConversionProgress) => {
    options.onProgress?.(progress);
  };

  notifyProgress({
    stage: 'initializing',
    stageDescription: 'Loading document into memory...',
    currentPage: 0,
    totalPages: 0,
    percentage: 5,
  });

  // 1. Analyze PDF layout and text streams
  const layout = await analyzePdfDocument(
    buffer,
    fileName,
    options.cancellationToken,
    (curr, total) => {
      notifyProgress({
        stage: 'analyzing',
        stageDescription: `Analyzing page layout (${curr}/${total})...`,
        currentPage: curr,
        totalPages: total,
        percentage: Math.round(10 + (curr / total) * 55),
      });
    }
  );

  if (options.cancellationToken?.isCancelled) {
    throw new Error('Conversion cancelled by user.');
  }

  // 2. Reconstruct Word document XML
  notifyProgress({
    stage: 'reconstructing',
    stageDescription: 'Reconstructing WordprocessingML paragraphs and styles...',
    currentPage: layout.totalPages,
    totalPages: layout.totalPages,
    percentage: 75,
  });

  const docxBytes = await buildDocxFromLayout(layout, {
    includePageBreaks: options.includePageBreaks ?? true,
  });

  if (options.cancellationToken?.isCancelled) {
    throw new Error('Conversion cancelled by user.');
  }

  // 3. Packaging & Validation
  notifyProgress({
    stage: 'validating',
    stageDescription: 'Validating OpenXML package integrity...',
    currentPage: layout.totalPages,
    totalPages: layout.totalPages,
    percentage: 90,
  });

  const isValid = await validateOpenXmlPackage(docxBytes, 'word/document.xml');
  if (!isValid) {
    throw new Error('Generated DOCX package failed OpenXML integrity validation.');
  }

  const outputName = options.outputFileName || deriveOutputFilename(fileName, '.docx');
  const blob = new Blob([docxBytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  // Calculate stats
  let totalBlocks = 0;
  let totalHeadings = 0;
  let totalParagraphs = 0;
  let totalWords = 0;

  for (const page of layout.pages) {
    totalBlocks += page.blocks.length;
    for (const b of page.blocks) {
      if (b.type === 'heading1' || b.type === 'heading2') {
        totalHeadings++;
      } else {
        totalParagraphs++;
      }
      totalWords += b.text.split(/\s+/).filter(Boolean).length;
    }
  }

  notifyProgress({
    stage: 'completed',
    stageDescription: 'Word document generated successfully.',
    currentPage: layout.totalPages,
    totalPages: layout.totalPages,
    percentage: 100,
  });

  return {
    blob,
    fileName: outputName,
    outputFileName: outputName,
    outputBytes: docxBytes,
    bytes: docxBytes,
    uint8Array: docxBytes,
    totalPages: layout.totalPages,
    fileSizeBytes: blob.size,
    durationMs: Date.now() - startTime,
    stats: {
      totalBlocks,
      totalHeadings,
      totalParagraphs,
      totalWords,
    },
  };
}

/**
 * Converts a PDF document into an editable Microsoft PowerPoint (.pptx) presentation
 */
export async function convertPdfToPpt(
  fileOrData: File | { name: string; buffer: ArrayBuffer },
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const startTime = Date.now();
  const fileName = fileOrData instanceof File ? fileOrData.name : fileOrData.name;
  const buffer = fileOrData instanceof File ? await fileOrData.arrayBuffer() : fileOrData.buffer;

  const notifyProgress = (progress: ConversionProgress) => {
    options.onProgress?.(progress);
  };

  notifyProgress({
    stage: 'initializing',
    stageDescription: 'Loading presentation into memory...',
    currentPage: 0,
    totalPages: 0,
    percentage: 5,
  });

  // 1. Analyze PDF layout and text positions
  const layout = await analyzePdfDocument(
    buffer,
    fileName,
    options.cancellationToken,
    (curr, total) => {
      notifyProgress({
        stage: 'analyzing',
        stageDescription: `Analyzing slide layout (${curr}/${total})...`,
        currentPage: curr,
        totalPages: total,
        percentage: Math.round(10 + (curr / total) * 55),
      });
    }
  );

  if (options.cancellationToken?.isCancelled) {
    throw new Error('Conversion cancelled by user.');
  }

  // 2. Reconstruct PowerPoint PresentationML slides
  notifyProgress({
    stage: 'reconstructing',
    stageDescription: 'Positioning slide shapes and typography...',
    currentPage: layout.totalPages,
    totalPages: layout.totalPages,
    percentage: 75,
  });

  const pptxBytes = await buildPptxFromLayout(layout);

  if (options.cancellationToken?.isCancelled) {
    throw new Error('Conversion cancelled by user.');
  }

  // 3. Packaging & Validation
  notifyProgress({
    stage: 'validating',
    stageDescription: 'Validating presentation package structure...',
    currentPage: layout.totalPages,
    totalPages: layout.totalPages,
    percentage: 90,
  });

  const isValid = await validateOpenXmlPackage(pptxBytes, 'ppt/presentation.xml');
  if (!isValid) {
    throw new Error('Generated PPTX package failed OpenXML integrity validation.');
  }

  const outputName = options.outputFileName || deriveOutputFilename(fileName, '.pptx');
  const blob = new Blob([pptxBytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });

  let totalBlocks = 0;
  let totalHeadings = 0;
  let totalParagraphs = 0;
  let totalWords = 0;

  for (const page of layout.pages) {
    totalBlocks += page.blocks.length;
    for (const b of page.blocks) {
      if (b.type === 'heading1' || b.type === 'heading2') {
        totalHeadings++;
      } else {
        totalParagraphs++;
      }
      totalWords += b.text.split(/\s+/).filter(Boolean).length;
    }
  }

  notifyProgress({
    stage: 'completed',
    stageDescription: 'PowerPoint presentation generated successfully.',
    currentPage: layout.totalPages,
    totalPages: layout.totalPages,
    percentage: 100,
  });

  return {
    blob,
    fileName: outputName,
    outputFileName: outputName,
    outputBytes: pptxBytes,
    bytes: pptxBytes,
    uint8Array: pptxBytes,
    totalPages: layout.totalPages,
    fileSizeBytes: blob.size,
    durationMs: Date.now() - startTime,
    stats: {
      totalBlocks,
      totalHeadings,
      totalParagraphs,
      totalWords,
    },
  };
}

export const convertPdfToPowerPoint = convertPdfToPpt;
