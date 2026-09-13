/**
 * PDFSimplify — Vector Page Resizing Engine
 * Adjusts PDF page dimensions to international presets or custom bounds
 * without rasterizing vector text or degrading graphics quality.
 */

import { PDFDocument } from 'pdf-lib';
import { assertValidPdfOutput } from './output-validator';
import { CancellationToken } from './conversion/types';

export type PagePreset = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Custom' | 'a4' | 'a3' | 'a5' | 'letter' | 'legal' | 'custom';
export type PageOrientation = 'portrait' | 'landscape' | 'auto';
export type ResizeMode = 'fit' | 'fill' | 'center';

export interface PageDimensions {
  width: number;
  height: number;
}

export const PRESET_DIMENSIONS: Record<string, PageDimensions> = {
  A4: { width: 595.28, height: 841.89 },
  a4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  a3: { width: 841.89, height: 1190.55 },
  A5: { width: 419.53, height: 595.28 },
  a5: { width: 419.53, height: 595.28 },
  Letter: { width: 612.0, height: 792.0 },
  letter: { width: 612.0, height: 792.0 },
  Legal: { width: 612.0, height: 1008.0 },
  legal: { width: 612.0, height: 1008.0 },
};

export interface ResizeOptions {
  preset: PagePreset;
  customDimensions?: PageDimensions;
  orientation?: PageOrientation;
  mode?: ResizeMode;
  scaling?: ResizeMode;
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
  buffer: ArrayBuffer | Uint8Array | { bytes?: Uint8Array; resizedBytes?: Uint8Array; uint8Array?: Uint8Array },
  options: ResizeOptions
): Promise<Uint8Array & ResizeResult & { pdfBytes: Uint8Array; uint8Array: Uint8Array }> {
  const startTime = Date.now();

  if (options.cancellationToken?.isCancelled) {
    throw new Error('Page resize cancelled by user.');
  }

  let rawBuffer: ArrayBuffer | Uint8Array;
  if (buffer instanceof Uint8Array || buffer instanceof ArrayBuffer) {
    rawBuffer = buffer;
  } else if (buffer && typeof buffer === 'object') {
    if ('bytes' in buffer && buffer.bytes) {
      rawBuffer = buffer.bytes;
    } else if ('resizedBytes' in buffer && buffer.resizedBytes) {
      rawBuffer = buffer.resizedBytes;
    } else if ('uint8Array' in buffer && buffer.uint8Array) {
      rawBuffer = buffer.uint8Array;
    } else {
      rawBuffer = buffer as unknown as ArrayBuffer;
    }
  } else {
    rawBuffer = buffer as unknown as ArrayBuffer;
  }

  const sourceDoc = await PDFDocument.load(rawBuffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();
  const targetDoc = await PDFDocument.create();

  // Determine base target dimensions
  let baseWidth: number;
  let baseHeight: number;

  const presetKey = Object.keys(PRESET_DIMENSIONS).find(
    (k) => k.toLowerCase() === (options.preset || '').toLowerCase()
  ) as keyof typeof PRESET_DIMENSIONS | undefined;

  if ((options.preset === 'Custom' || String(options.preset).toLowerCase() === 'custom') && options.customDimensions) {
    baseWidth = Math.max(10, options.customDimensions.width);
    baseHeight = Math.max(10, options.customDimensions.height);
  } else if (presetKey && PRESET_DIMENSIONS[presetKey]) {
    const dims = PRESET_DIMENSIONS[presetKey];
    baseWidth = dims.width;
    baseHeight = dims.height;
  } else {
    baseWidth = PRESET_DIMENSIONS.A4.width;
    baseHeight = PRESET_DIMENSIONS.A4.height;
  }

  // Adjust for orientation
  if (options.orientation === 'landscape' && baseWidth < baseHeight) {
    const tmp = baseWidth;
    baseWidth = baseHeight;
    baseHeight = tmp;
  } else if (options.orientation === 'portrait' && baseWidth > baseHeight) {
    const tmp = baseWidth;
    baseWidth = baseHeight;
    baseHeight = tmp;
  }

  const pagesToResize = parsePageRange(options.pageRange, totalPages);
  const mode = options.mode || (options as { scaling?: ResizeMode }).scaling || 'fit';

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    const sourcePage = sourceDoc.getPage(i);
    const origWidth = sourcePage.getWidth();
    const origHeight = sourcePage.getHeight();

    // Determine orientation per page if auto
    let finalWidth = baseWidth;
    let finalHeight = baseHeight;

    if (options.orientation === 'auto') {
      const isLandscape = origWidth > origHeight;
      if (isLandscape && baseWidth < baseHeight) {
        finalWidth = baseHeight;
        finalHeight = baseWidth;
      } else if (!isLandscape && baseWidth > baseHeight) {
        finalWidth = baseHeight;
        finalHeight = baseWidth;
      }
    }

    const newPage = targetDoc.addPage([finalWidth, finalHeight]);

    if (!pagesToResize.has(pageNum)) {
      // Just copy original page without resizing
      const [embeddedPage] = await targetDoc.embedPdf(sourceDoc, [i]);
      newPage.drawPage(embeddedPage, {
        x: (finalWidth - origWidth) / 2,
        y: (finalHeight - origHeight) / 2,
        width: origWidth,
        height: origHeight,
      });
      continue;
    }

    const [embeddedPage] = await targetDoc.embedPdf(sourceDoc, [i]);

    let scale = 1.0;
    if (mode === 'fit') {
      // Scale down or up to fit completely within target bounds
      scale = Math.min(finalWidth / embeddedPage.width, finalHeight / embeddedPage.height);
    } else if (mode === 'fill') {
      // Scale to completely cover target bounds
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

  const result = Object.assign(resizedBytes, {
    resizedBytes,
    pdfBytes: resizedBytes,
    uint8Array: resizedBytes,
    targetDimensions: { width: baseWidth, height: baseHeight },
    totalPages,
    durationMs: Date.now() - startTime,
  });

  return result as Uint8Array & ResizeResult & { pdfBytes: Uint8Array; uint8Array: Uint8Array };
}
