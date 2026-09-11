/**
 * iLikePDF — Vector Page Resizing Engine
 * Adjusts PDF page dimensions to international presets or custom bounds
 * without rasterizing vector text or degrading graphics quality.
 */

import { PDFDocument } from 'pdf-lib';
import { assertValidPdfOutput } from './output-validator';
import { CancellationToken } from './conversion/types';

export type PagePreset = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Custom';
export type PageOrientation = 'portrait' | 'landscape' | 'auto';
export type ResizeMode = 'fit' | 'fill' | 'center';

export interface PageDimensions {
  width: number;
  height: number;
}

export const PRESET_DIMENSIONS: Record<Exclude<PagePreset, 'Custom'>, PageDimensions> = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  A5: { width: 419.53, height: 595.28 },
  Letter: { width: 612.0, height: 792.0 },
  Legal: { width: 612.0, height: 1008.0 },
};

export interface ResizeOptions {
  preset: PagePreset;
  customDimensions?: PageDimensions;
  orientation?: PageOrientation;
  mode?: ResizeMode;
  pageRange?: string; // 'all' or '1-3, 5'
  cancellationToken?: CancellationToken;
}

export interface ResizeResult {
  resizedBytes: Uint8Array;
  targetDimensions: PageDimensions;
  totalPages: number;
  durationMs: number;
}

function parsePageRange(rangeStr: string | undefined, totalPages: number): Set<number> {
  const result = new Set<number>();
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    for (let i = 1; i <= totalPages; i++) result.add(i);
    return result;
  }

  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [s, e] = trimmed.split('-');
      const start = parseInt(s, 10);
      const end = parseInt(e, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          result.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        result.add(p);
      }
    }
  }

  return result.size > 0 ? result : parsePageRange('all', totalPages);
}

export async function resizePdf(
  buffer: ArrayBuffer,
  options: ResizeOptions
): Promise<ResizeResult> {
  const startTime = Date.now();

  if (options.cancellationToken?.isCancelled) {
    throw new Error('Page resize cancelled by user.');
  }

  const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();
  const targetDoc = await PDFDocument.create();

  // Determine base target dimensions
  let baseWidth: number;
  let baseHeight: number;

  if (options.preset === 'Custom' && options.customDimensions) {
    baseWidth = Math.max(10, options.customDimensions.width);
    baseHeight = Math.max(10, options.customDimensions.height);
  } else if (options.preset !== 'Custom') {
    const dims = PRESET_DIMENSIONS[options.preset];
    baseWidth = dims.width;
    baseHeight = dims.height;
  } else {
    baseWidth = PRESET_DIMENSIONS.A4.width;
    baseHeight = PRESET_DIMENSIONS.A4.height;
  }

  const pagesToResize = parsePageRange(options.pageRange, totalPages);
  const mode = options.mode || 'fit';

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    const sourcePage = sourceDoc.getPage(i);
    const origWidth = sourcePage.getWidth();
    const origHeight = sourcePage.getHeight();

    if (!pagesToResize.has(pageNum)) {
      // Retain original page without modification
      const [copied] = await targetDoc.copyPages(sourceDoc, [i]);
      targetDoc.addPage(copied);
      continue;
    }

    // Determine orientation for this page
    let finalWidth = baseWidth;
    let finalHeight = baseHeight;

    if (options.orientation === 'portrait') {
      finalWidth = Math.min(baseWidth, baseHeight);
      finalHeight = Math.max(baseWidth, baseHeight);
    } else if (options.orientation === 'landscape') {
      finalWidth = Math.max(baseWidth, baseHeight);
      finalHeight = Math.min(baseWidth, baseHeight);
    } else {
      // Auto: match source page aspect ratio
      const sourceIsLandscape = origWidth > origHeight;
      if (sourceIsLandscape) {
        finalWidth = Math.max(baseWidth, baseHeight);
        finalHeight = Math.min(baseWidth, baseHeight);
      } else {
        finalWidth = Math.min(baseWidth, baseHeight);
        finalHeight = Math.max(baseWidth, baseHeight);
      }
    }

    // Embed source page as vector content
    const [embeddedPage] = await targetDoc.embedPdf(sourceDoc, [i]);
    const newPage = targetDoc.addPage([finalWidth, finalHeight]);

    let scale = 1.0;
    if (mode === 'fit') {
      scale = Math.min(finalWidth / embeddedPage.width, finalHeight / embeddedPage.height);
    } else if (mode === 'fill') {
      scale = Math.max(finalWidth / embeddedPage.width, finalHeight / embeddedPage.height);
    } else {
      // Center without scaling
      scale = 1.0;
    }

    const scaledW = embeddedPage.width * scale;
    const scaledH = embeddedPage.height * scale;
    const xOffset = (finalWidth - scaledW) / 2;
    const yOffset = (finalHeight - scaledH) / 2;

    newPage.drawPage(embeddedPage, {
      x: xOffset,
      y: yOffset,
      width: scaledW,
      height: scaledH,
    });
  }

  const resizedBytes = await targetDoc.save();

  // Validate output PDF
  await assertValidPdfOutput(resizedBytes, {
    expectedPages: totalPages,
  });

  return {
    resizedBytes,
    targetDimensions: { width: baseWidth, height: baseHeight },
    totalPages,
    durationMs: Date.now() - startTime,
  };
}
