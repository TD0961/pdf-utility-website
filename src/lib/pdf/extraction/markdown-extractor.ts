/**
 * PDFSimplify — Zero-Backend PDF to Markdown Converter
 * Analyzes PDF typography and layout, reconstructs headings and paragraphs,
 * and generates clean GitHub Flavored Markdown directly in the browser.
 */

import { analyzePdfDocument } from '../conversion/layout/page-analyzer';
import { buildMarkdownFromLayout, MarkdownBuilderOptions } from './markdown-builder';
import { deriveOutputFilename } from '../conversion/converter';
import { ConversionProgress, CancellationToken } from '../conversion/types';

export interface MarkdownExtractorOptions extends MarkdownBuilderOptions {
  onProgress?: (progress: ConversionProgress) => void;
  cancellationToken?: CancellationToken;
}

export interface MarkdownExtractionResult {
  markdownText: string;
  markdownContent: string;
  outputBlob: Blob;
  outputFileName: string;
  totalPages: number;
  wordCount: number;
  charCount: number;
  durationMs: number;
}

export async function convertPdfToMarkdown(
  fileOrData: File | ArrayBuffer | Uint8Array | { name?: string; buffer?: ArrayBuffer; bytes?: Uint8Array },
  options: MarkdownExtractorOptions = {}
): Promise<MarkdownExtractionResult> {
  const startTime = Date.now();

  let buffer: ArrayBuffer;
  let fileName = 'document.pdf';

  if (fileOrData instanceof File) {
    fileName = fileOrData.name;
    buffer = await fileOrData.arrayBuffer();
  } else if (fileOrData instanceof Uint8Array) {
    buffer = fileOrData.buffer.slice(fileOrData.byteOffset, fileOrData.byteOffset + fileOrData.byteLength) as ArrayBuffer;
  } else if (fileOrData instanceof ArrayBuffer) {
    buffer = fileOrData;
  } else if (fileOrData && typeof fileOrData === 'object') {
    fileName = (fileOrData as { name?: string }).name || 'document.pdf';
    if ('bytes' in fileOrData && (fileOrData as { bytes: Uint8Array }).bytes instanceof Uint8Array) {
      const b = (fileOrData as { bytes: Uint8Array }).bytes;
      buffer = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
    } else if ('buffer' in fileOrData && (fileOrData as { buffer: ArrayBuffer }).buffer instanceof ArrayBuffer) {
      buffer = (fileOrData as { buffer: ArrayBuffer }).buffer;
    } else {
      buffer = fileOrData as unknown as ArrayBuffer;
    }
  } else {
    buffer = fileOrData as unknown as ArrayBuffer;
  }

  const notifyProgress = (progress: ConversionProgress) => {
    options.onProgress?.(progress);
  };

  notifyProgress({
    stage: 'initializing',
    stageDescription: 'Analyzing document structure for Markdown export...',
    currentPage: 0,
    totalPages: 0,
    percentage: 10,
  });

  const layout = await analyzePdfDocument(
    buffer,
    fileName,
    options.cancellationToken,
    (curr, total) => {
      notifyProgress({
        stage: 'analyzing',
        stageDescription: `Analyzing structure and typography on page ${curr}/${total}...`,
        currentPage: curr,
        totalPages: total,
        percentage: Math.round(10 + (curr / total) * 75),
      });
    }
  );

  notifyProgress({
    stage: 'packaging',
    stageDescription: 'Synthesizing clean Markdown syntax...',
    currentPage: layout.totalPages,
    totalPages: layout.totalPages,
    percentage: 85,
  });

  const markdownText = buildMarkdownFromLayout(layout);
  const outputBlob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
  const outputFileName = deriveOutputFilename(fileName, 'md');

  const wordCount = (markdownText.match(/\S+/g) || []).length;
  const charCount = markdownText.length;

  notifyProgress({
    stage: 'completed',
    stageDescription: 'Markdown document ready.',
    currentPage: layout.totalPages,
    totalPages: layout.totalPages,
    percentage: 100,
  });

  return {
    markdownText,
    markdownContent: markdownText,
    outputBlob,
    outputFileName,
    totalPages: layout.totalPages,
    wordCount,
    charCount,
    durationMs: Date.now() - startTime,
  };
}
