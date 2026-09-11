/**
 * iLikePDF — Zero-Backend PDF to CSV Extractor
 * Extracts tables and structured tabular data from PDF pages into standard CSV.
 */

import { getPdfDocument } from '../pdf-renderer';
import { clusterIntoRows, detectColumnAnchors, alignRowsToColumns, RawTextItem } from './table-detector';
import { buildCsvFromGrid, CsvBuilderOptions } from './csv-builder';
import { deriveOutputFilename } from '../conversion/converter';
import { CancellationToken, ConversionProgress } from '../conversion/types';

export interface CsvExtractorOptions extends CsvBuilderOptions {
  onProgress?: (progress: ConversionProgress) => void;
  cancellationToken?: CancellationToken;
  pageRange?: string; // 'all' or '1-3, 5'
}

export interface CsvExtractionResult {
  csvText: string;
  outputBlob: Blob;
  outputFileName: string;
  rowCount: number;
  columnCount: number;
  totalPages: number;
  durationMs: number;
}

/**
 * Parses user page range string (e.g. '1-3, 5') into 1-based page numbers.
 */
function parsePageRange(rangeStr: string | undefined, totalPages: number): number[] {
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          pages.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pages.add(p);
      }
    }
  }

  const result = Array.from(pages).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
}

export async function convertPdfToCsv(
  fileOrData: File | { name: string; buffer: ArrayBuffer },
  options: CsvExtractorOptions = {}
): Promise<CsvExtractionResult> {
  const startTime = Date.now();
  const fileName = fileOrData instanceof File ? fileOrData.name : fileOrData.name;
  const buffer = fileOrData instanceof File ? await fileOrData.arrayBuffer() : fileOrData.buffer;

  const notifyProgress = (progress: ConversionProgress) => {
    options.onProgress?.(progress);
  };

  notifyProgress({
    stage: 'initializing',
    stageDescription: 'Loading PDF document for table extraction...',
    currentPage: 0,
    totalPages: 0,
    percentage: 5,
  });

  const pdfDoc = await getPdfDocument(buffer);
  const totalPages = pdfDoc.numPages;

  if (totalPages === 0) {
    throw new Error('The selected PDF contains zero pages.');
  }

  const targetPages = parsePageRange(options.pageRange, totalPages);
  const allGridRows: string[][] = [];
  let maxCols = 0;

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx];
    if (options.cancellationToken?.isCancelled) {
      throw new Error('Conversion cancelled by user.');
    }

    notifyProgress({
      stage: 'analyzing',
      stageDescription: `Analyzing table structure on page ${pageNum}/${totalPages}...`,
      currentPage: pageNum,
      totalPages,
      percentage: Math.round(10 + ((idx + 1) / targetPages.length) * 75),
    });

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const rawItems: RawTextItem[] = [];

    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
        const x = item.transform[4];
        const y = viewport.height - item.transform[5];
        rawItems.push({
          str: item.str,
          x,
          y,
          width: item.width || item.str.length * 6,
          height: item.height || 12,
        });
      }
    }

    if (rawItems.length > 0) {
      const rows = clusterIntoRows(rawItems);
      const colAnchors = detectColumnAnchors(rows);
      const pageGrid = alignRowsToColumns(rows, colAnchors);

      for (const row of pageGrid) {
        allGridRows.push(row);
        if (row.length > maxCols) {
          maxCols = row.length;
        }
      }
    }
  }

  notifyProgress({
    stage: 'packaging',
    stageDescription: 'Compiling structured CSV data...',
    currentPage: totalPages,
    totalPages,
    percentage: 92,
  });

  // If no tabular rows were found, provide a graceful single-cell notification
  const finalGrid = allGridRows.length > 0
    ? allGridRows
    : [['[No extractable text or tables found in document]']];

  const csvText = buildCsvFromGrid(finalGrid, {
    delimiter: options.delimiter || ',',
    lineTerminator: options.lineTerminator || '\n',
    alwaysQuote: options.alwaysQuote,
  });

  const outputBlob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const outputFileName = deriveOutputFilename(fileName, 'csv');

  notifyProgress({
    stage: 'completed',
    stageDescription: 'CSV export complete.',
    currentPage: totalPages,
    totalPages,
    percentage: 100,
  });

  return {
    csvText,
    outputBlob,
    outputFileName,
    rowCount: finalGrid.length,
    columnCount: maxCols || 1,
    totalPages,
    durationMs: Date.now() - startTime,
  };
}
