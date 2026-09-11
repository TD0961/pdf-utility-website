/**
 * iLikePDF — Zero-Backend PDF to Markdown Converter
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
  outputBlob: Blob;
  outputFileName: string;
  totalPages: number;
  wordCount: number;
  charCount: number;
  durationMs: number;
}

export async function convertPdfToMarkdown(
  fileOrData: File | { name: string; buffer: ArrayBuffer },
  options: MarkdownExtractorOptions = {}
): Promise<MarkdownExtractionResult> {
  const startTime = Date.now();
  const fileName = fileOrData instanceof File ? fileOrData.name : fileOrData.name;
  const buffer = fileOrData instanceof File ? await fileOrData.arrayBuffer() : fileOrData.buffer;

  const notifyProgress = (progress: ConversionProgress) => {
    options.onProgress?.(progress);
  };

  notifyProgress({
    stage: 'initializing',
    stageDescription: 'Loading PDF document for Markdown analysis...',
    currentPage: 0,
    totalPages: 0,
    percentage: 5,
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
    stageDescription: 'Formatting Markdown syntax...',
    currentPage: layout.totalPages,
    totalPages: layout.totalPages,
    percentage: 92,
  });

  const markdownText = buildMarkdownFromLayout(layout, options);
  const outputBlob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
  const outputFileName = deriveOutputFilename(fileName, 'md');

  // Calculate statistics
  const trimmed = markdownText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
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
    outputBlob,
    outputFileName,
    totalPages: layout.totalPages,
    wordCount,
    charCount,
    durationMs: Date.now() - startTime,
  };
}
