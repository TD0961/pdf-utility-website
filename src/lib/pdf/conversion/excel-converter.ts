/**
 * PDFSimplify — Zero-Backend PDF to Excel (.xlsx) Converter
 * Analyzes PDF coordinate geometry, clusters text into rows and columns,
 * and generates standards-compliant Excel spreadsheets directly in the browser.
 */

import { getPdfJs } from '../pdf-renderer';
import { buildXlsxFromSheets, XlsxSheetData, XlsxRow } from './xlsx-builder';
import { validateOpenXmlPackage, deriveOutputFilename } from './converter';
import {
  ConversionOptions,
  ConversionResult,
  ConversionProgress,
} from './types';

interface RawTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExcelConversionOptions extends ConversionOptions {
  oneSheetPerPage?: boolean;
}

export async function convertPdfToExcel(
  fileOrData: File | { name: string; buffer: ArrayBuffer },
  options: ExcelConversionOptions = {}
): Promise<ConversionResult> {
  const startTime = Date.now();
  const fileName = fileOrData instanceof File ? fileOrData.name : fileOrData.name;
  const buffer = fileOrData instanceof File ? await fileOrData.arrayBuffer() : fileOrData.buffer;

  const notifyProgress = (progress: ConversionProgress) => {
    options.onProgress?.(progress);
  };

  notifyProgress({
    stage: 'initializing',
    stageDescription: 'Loading document for spreadsheet extraction...',
    currentPage: 0,
    totalPages: 0,
    percentage: 5,
  });

  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  if (totalPages === 0) {
    await pdfDoc.cleanup();
    await loadingTask.destroy();
    throw new Error('The selected PDF contains zero pages.');
  }

  const sheets: XlsxSheetData[] = [];
  let consolidatedRows: XlsxRow[] = [];
  let totalExtractedCells = 0;
  let totalTableRows = 0;

  try {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (options.cancellationToken?.isCancelled) {
      throw new Error('Conversion cancelled by user.');
    }

    notifyProgress({
      stage: 'analyzing',
      stageDescription: `Analyzing table grid and cells on page ${pageNum}/${totalPages}...`,
      currentPage: pageNum,
      totalPages,
      percentage: Math.round(10 + (pageNum / totalPages) * 60),
    });

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const rawItems: RawTextItem[] = [];

    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
        // PDF coordinates have origin at bottom-left; convert to top-left coordinate system
        const x = item.transform[4];
        const y = viewport.height - item.transform[5];
        rawItems.push({
          str: item.str,
          x,
          y,
          width: item.width,
          height: item.height,
        });
      }
    }

    // Cluster items into visual rows by Y-coordinate
    const rows = clusterIntoRows(rawItems);
    totalTableRows += rows.length;

    // Detect column anchors from all rows on this page
    const colAnchors = detectColumns(rows);

    const pageRows: XlsxRow[] = [];

    // If multi-page consolidated sheet, add a page separator row if not page 1
    if (!options.oneSheetPerPage && totalPages > 1 && pageNum > 1) {
      pageRows.push({
        cells: [`[Page ${pageNum}]`],
      });
    }

    for (const rowItems of rows) {
      const cellValues = mapRowToColumns(rowItems, colAnchors);
      if (cellValues.some((v) => v !== null && v !== '')) {
        pageRows.push({ cells: cellValues });
        totalExtractedCells += cellValues.filter((v) => v !== null && v !== '').length;
      }
    }

      if (options.oneSheetPerPage) {
        sheets.push({
          name: `Page ${pageNum}`,
          rows: pageRows.length > 0 ? pageRows : [{ cells: ['(No text on page)'] }],
        });
      } else {
        consolidatedRows = consolidatedRows.concat(pageRows);
      }
    }
  } finally {
    await pdfDoc.cleanup();
    await loadingTask.destroy();
  }

  if (!options.oneSheetPerPage) {
    sheets.push({
      name: 'Extracted Data',
      rows: consolidatedRows.length > 0 ? consolidatedRows : [{ cells: ['(No text extracted)'] }],
    });
  }

  notifyProgress({
    stage: 'reconstructing',
    stageDescription: 'Building OpenXML spreadsheet (.xlsx)...',
    currentPage: totalPages,
    totalPages,
    percentage: 80,
  });

  const xlsxBytes = await buildXlsxFromSheets(sheets, {
    title: fileName.replace(/\.pdf$/i, ''),
  });

  notifyProgress({
    stage: 'validating',
    stageDescription: 'Verifying spreadsheet package integrity...',
    currentPage: totalPages,
    totalPages,
    percentage: 92,
  });

  const isValid = await validateOpenXmlPackage(xlsxBytes, 'xl/workbook.xml');
  if (!isValid) {
    throw new Error('Generated Excel workbook failed OpenXML package verification.');
  }

  const outFileName = deriveOutputFilename(fileName, 'xlsx');
  const blob = new Blob([xlsxBytes as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  notifyProgress({
    stage: 'completed',
    stageDescription: 'Excel spreadsheet ready for download.',
    currentPage: totalPages,
    totalPages,
    percentage: 100,
  });

  return {
    blob,
    fileName: outFileName,
    outputFileName: outFileName,
    outputBytes: xlsxBytes,
    bytes: xlsxBytes,
    uint8Array: xlsxBytes,
    totalPages,
    fileSizeBytes: xlsxBytes.length,
    durationMs: Date.now() - startTime,
    stats: {
      totalBlocks: totalTableRows,
      totalHeadings: 0,
      totalParagraphs: totalTableRows,
      totalWords: totalExtractedCells,
    },
  };
}

/**
 * Clusters text items that share approximately the same Y-baseline into rows
 */
function clusterIntoRows(items: RawTextItem[], yTolerance = 5): RawTextItem[][] {
  if (items.length === 0) return [];

  // Sort primarily by Y ascending, then by X ascending
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) <= yTolerance) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  const rows: RawTextItem[][] = [];
  let currentRow: RawTextItem[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    const avgY = currentRow.reduce((sum, el) => sum + el.y, 0) / currentRow.length;

    if (Math.abs(item.y - avgY) <= yTolerance) {
      currentRow.push(item);
    } else {
      currentRow.sort((a, b) => a.x - b.x);
      rows.push(currentRow);
      currentRow = [item];
    }
  }

  if (currentRow.length > 0) {
    currentRow.sort((a, b) => a.x - b.x);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Detects common column left-boundaries by analyzing the X positions of items across all rows
 */
function detectColumns(rows: RawTextItem[][], minGap = 20): number[] {
  const xPositions: number[] = [];

  for (const row of rows) {
    for (const item of row) {
      xPositions.push(item.x);
    }
  }

  if (xPositions.length === 0) return [0];

  xPositions.sort((a, b) => a - b);

  // Cluster X positions that are close to each other
  const clusters: { sum: number; count: number }[] = [];
  for (const x of xPositions) {
    const matching = clusters.find((c) => Math.abs(x - c.sum / c.count) <= minGap);
    if (matching) {
      matching.sum += x;
      matching.count += 1;
    } else {
      clusters.push({ sum: x, count: 1 });
    }
  }

  // Filter clusters with enough items or return distinct columns
  return clusters
    .map((c) => c.sum / c.count)
    .sort((a, b) => a - b);
}

/**
 * Maps items in a single row to their corresponding column index
 */
function mapRowToColumns(row: RawTextItem[], colAnchors: number[]): (string | null)[] {
  if (colAnchors.length === 0) {
    return [row.map((r) => r.str).join(' ')];
  }

  const result: string[] = new Array(colAnchors.length).fill('');

  for (const item of row) {
    // Find closest column anchor
    let closestCol = 0;
    let minDiff = Infinity;

    for (let c = 0; c < colAnchors.length; c++) {
      const diff = Math.abs(item.x - colAnchors[c]);
      if (diff < minDiff) {
        minDiff = diff;
        closestCol = c;
      }
    }

    if (result[closestCol]) {
      result[closestCol] += ' ' + item.str;
    } else {
      result[closestCol] = item.str;
    }
  }

  // Trim each cell
  return result.map((cell) => {
    const trimmed = cell.trim();
    return trimmed.length > 0 ? trimmed : null;
  });
}
