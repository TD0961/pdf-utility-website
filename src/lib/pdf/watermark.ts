/**
 * Dedicated Watermark PDF Engine
 * 100% in-browser PDF text watermarking using pdf-lib.
 * Adds non-destructive vector text watermark overlays without rasterizing original content.
 * Supports customizable positions, rotation angles, opacity, font size, colors, tiled watermarks,
 * and rotation-aware coordinate transforms across 0°, 90°, 180°, and 270° orientations.
 */

import { PDFDocument, StandardFonts, rgb, degrees, Color } from 'pdf-lib';
import { validatePdfMagicBytes, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { parsePageRanges } from './range-parser';
import { assertValidPdfOutput } from './output-validator';

export type WatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'tiled';

export type WatermarkColorPreset = 'gray' | 'red' | 'blue' | 'black' | 'green' | 'orange';

export interface WatermarkProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

export interface WatermarkPdfOptions {
  file: File | { name: string; buffer: ArrayBuffer };
  text: string;
  position?: WatermarkPosition;
  rotation?: number; // visual angle in degrees, default 45 for center, 0 for top/bottom
  opacity?: number; // 0.05 to 1.0, default 0.3
  fontSize?: number; // in points, 12 to 120, default 48
  color?: WatermarkColorPreset | string; // preset name or #RRGGBB hex
  pages?: 'all' | string; // 'all' or custom range like "1-3, 5"
  margin?: number; // margin from visual edges in pt, default 40
  outputFileName?: string;
  onProgress?: WatermarkProgressCallback;
}

export interface WatermarkPdfResult {
  blob: Blob;
  uint8Array: Uint8Array;
  totalPages: number;
  fileSize: number;
  fileName: string;
}

const COLOR_PRESETS: Record<WatermarkColorPreset, Color> = {
  gray: rgb(0.5, 0.5, 0.5),
  red: rgb(0.85, 0.15, 0.15),
  blue: rgb(0.15, 0.35, 0.85),
  black: rgb(0, 0, 0),
  green: rgb(0.15, 0.6, 0.2),
  orange: rgb(0.9, 0.45, 0.05),
};

export function parseWatermarkColor(colorInput: WatermarkColorPreset | string): Color {
  if (colorInput in COLOR_PRESETS) {
    return COLOR_PRESETS[colorInput as WatermarkColorPreset];
  }

  // Check if hex string
  const cleanHex = colorInput.replace('#', '').trim();
  if (/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }

  // Fallback to default gray
  return COLOR_PRESETS.gray;
}

/**
 * Calculates page-space coordinates (x, y) and rotation angle for text drawing
 * so that the text's center aligns with the desired visual center (cxv, cyv)
 * and appears at the visual angle thetaVisual (degrees) on a page with rotation R.
 */
export function computeWatermarkCoords(
  pageWidth: number,
  pageHeight: number,
  pageRotation: number,
  visualCenter: { cxv: number; cyv: number },
  textWidth: number,
  textHeight: number,
  visualAngleDegrees: number
): { x: number; y: number; textRotate: number } {
  const R = ((pageRotation % 360) + 360) % 360;
  const thetaV = ((visualAngleDegrees % 360) + 360) % 360;
  const rad = (thetaV * Math.PI) / 180;

  // Vector from text origin (bottom-left) to text center after rotation by thetaV
  const dx = (textWidth / 2) * Math.cos(rad) - (textHeight / 2) * Math.sin(rad);
  const dy = (textWidth / 2) * Math.sin(rad) + (textHeight / 2) * Math.cos(rad);

  // Visual origin of text
  const xv = visualCenter.cxv - dx;
  const yv = visualCenter.cyv - dy;

  // Transform visual origin (xv, yv) to PDF page space
  let x = 0;
  let y = 0;
  if (R === 0) {
    x = xv;
    y = yv;
  } else if (R === 90) {
    x = pageWidth - yv;
    y = xv;
  } else if (R === 180) {
    x = pageWidth - xv;
    y = pageHeight - yv;
  } else if (R === 270) {
    x = yv;
    y = pageHeight - xv;
  }

  // Text rotation angle in page space counteracts the viewer's clockwise rotation R
  const textRotate = ((thetaV + R) % 360 + 360) % 360;

  return { x, y, textRotate };
}

/**
 * Computes visual center points for single or tiled watermark placement.
 */
export function getVisualCenters(
  position: WatermarkPosition,
  visualWidth: number,
  visualHeight: number,
  textWidth: number,
  textHeight: number,
  margin: number
): Array<{ cxv: number; cyv: number }> {
  if (position === 'tiled') {
    // 3 columns x 3 rows grid
    const cols = 3;
    const rows = 3;
    const centers: Array<{ cxv: number; cyv: number }> = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cxv = (visualWidth / (cols + 1)) * (c + 1);
        const cyv = (visualHeight / (rows + 1)) * (r + 1);
        centers.push({ cxv, cyv });
      }
    }
    return centers;
  }

  switch (position) {
    case 'top-left':
      return [{ cxv: margin + textWidth / 2, cyv: visualHeight - margin - textHeight / 2 }];
    case 'top-center':
      return [{ cxv: visualWidth / 2, cyv: visualHeight - margin - textHeight / 2 }];
    case 'top-right':
      return [{ cxv: visualWidth - margin - textWidth / 2, cyv: visualHeight - margin - textHeight / 2 }];
    case 'middle-left':
      return [{ cxv: margin + textWidth / 2, cyv: visualHeight / 2 }];
    case 'middle-right':
      return [{ cxv: visualWidth - margin - textWidth / 2, cyv: visualHeight / 2 }];
    case 'bottom-left':
      return [{ cxv: margin + textWidth / 2, cyv: margin + textHeight / 2 }];
    case 'bottom-center':
      return [{ cxv: visualWidth / 2, cyv: margin + textHeight / 2 }];
    case 'bottom-right':
      return [{ cxv: visualWidth - margin - textWidth / 2, cyv: margin + textHeight / 2 }];
    case 'center':
    default:
      return [{ cxv: visualWidth / 2, cyv: visualHeight / 2 }];
  }
}

/**
 * Adds text watermarks to pages of a PDF document.
 */
export async function watermarkPdf({
  file,
  text,
  position = 'center',
  rotation,
  opacity = 0.3,
  fontSize = 48,
  color = 'gray',
  pages = 'all',
  margin = 40,
  outputFileName,
  onProgress,
}: WatermarkPdfOptions): Promise<WatermarkPdfResult> {
  const trimmedText = text ? text.trim() : '';
  if (!trimmedText) {
    throw new Error('Please provide watermark text.');
  }

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

  onProgress?.(0, 10, 'Loading PDF document...', 10);

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    if (pdfDoc.isEncrypted) {
      throw new Error('This PDF is password-protected. Please unlock it before adding a watermark.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (msg.includes('password') || msg.includes('encrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before adding a watermark.');
    }
    throw new Error('Could not parse PDF. The file may be damaged or corrupted.');
  }

  const totalPages = pdfDoc.getPageCount();
  if (totalPages === 0) {
    throw new Error('This PDF contains zero pages.');
  }

  // Determine target pages
  let targetPageIndices = new Set<number>();
  if (pages === 'all') {
    targetPageIndices = new Set(Array.from({ length: totalPages }, (_, i) => i));
  } else {
    const rangeResult = parsePageRanges(pages, totalPages);
    if (!rangeResult.valid) {
      throw new Error(rangeResult.error || 'Invalid page range specified for watermark.');
    }
    targetPageIndices = new Set(rangeResult.allPageIndices);
  }

  if (targetPageIndices.size === 0) {
    throw new Error('No pages were selected for watermarking.');
  }

  onProgress?.(2, 10, 'Preparing watermark typography...', 20);

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const sizePt = Math.max(10, Math.min(150, fontSize));
  const textWidth = font.widthOfTextAtSize(trimmedText, sizePt);
  const textHeight = sizePt; // standard cap-height approximation for Helvetica
  const resolvedColor = parseWatermarkColor(color);
  const safeOpacity = Math.max(0.05, Math.min(1.0, opacity));

  // Determine visual rotation angle
  // Default to 45 deg for center and tiled, 0 deg for edge positions
  const defaultAngle = position === 'center' || position === 'tiled' ? 45 : 0;
  const visualAngle = rotation !== undefined ? rotation : defaultAngle;

  let processedCount = 0;
  const targetTotal = targetPageIndices.size;

  for (let i = 0; i < totalPages; i++) {
    if (targetPageIndices.has(i)) {
      const page = pdfDoc.getPage(i);
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const rotationAngle = page.getRotation().angle;

      const isTransposed = rotationAngle === 90 || rotationAngle === 270;
      const visualWidth = isTransposed ? pageHeight : pageWidth;
      const visualHeight = isTransposed ? pageWidth : pageHeight;

      const centers = getVisualCenters(position, visualWidth, visualHeight, textWidth, textHeight, margin);

      for (const center of centers) {
        const coords = computeWatermarkCoords(
          pageWidth,
          pageHeight,
          rotationAngle,
          center,
          textWidth,
          textHeight,
          visualAngle
        );

        page.drawText(trimmedText, {
          x: coords.x,
          y: coords.y,
          size: sizePt,
          font,
          color: resolvedColor,
          opacity: safeOpacity,
          rotate: degrees(coords.textRotate),
        });
      }

      processedCount++;
      const pct = Math.round(20 + (processedCount / targetTotal) * 70);
      onProgress?.(processedCount, targetTotal, `Watermarking page ${i + 1}...`, pct);
    }
  }

  onProgress?.(targetTotal, targetTotal, 'Validating output document...', 92);

  const savedBytes = await pdfDoc.save();
  await assertValidPdfOutput(savedBytes, { expectedPages: totalPages });

  const finalName = sanitizeDownloadFilename(outputFileName || `${baseFileName}-watermarked.pdf`);
  const blob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  onProgress?.(targetTotal, targetTotal, 'Complete!', 100);

  return {
    blob,
    uint8Array: savedBytes,
    totalPages,
    fileSize: savedBytes.byteLength,
    fileName: finalName,
  };
}
