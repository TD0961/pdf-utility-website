/**
 * Phase 3C.1: PDF Editor Engine — Export Engine
 * High-fidelity, client-side PDF export without rasterization.
 * Preserves original text, vector paths, and document links using pdf-lib copyPages,
 * and compiles newly added editor annotations and vector shapes into native PDF streams.
 */

import { PDFDocument, StandardFonts, rgb, degrees, PDFFont, PDFImage } from 'pdf-lib';
import { ColorRgb, EditorDocumentState, EditorExportResult, SupportedFontFamily } from './types';
import { assertValidPdfOutput } from '../output-validator';
import { sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { hexToRgb, COLORS } from './objects';

export function toPdfColor(color: ColorRgb | string | undefined, fallback: ColorRgb = COLORS.BLACK) {
  if (!color) return rgb(fallback.r, fallback.g, fallback.b);
  if (typeof color === 'string') {
    const c = hexToRgb(color);
    return rgb(c.r, c.g, c.b);
  }
  const r = typeof color.r === 'number' && Number.isFinite(color.r) ? Math.max(0, Math.min(1, color.r)) : fallback.r;
  const g = typeof color.g === 'number' && Number.isFinite(color.g) ? Math.max(0, Math.min(1, color.g)) : fallback.g;
  const b = typeof color.b === 'number' && Number.isFinite(color.b) ? Math.max(0, Math.min(1, color.b)) : fallback.b;
  return rgb(r, g, b);
}

export interface EditorExportOptions {
  outputFileName?: string;
  onProgress?: (stage: string, percent: number) => void;
}

/**
 * Generates a clean, deterministic, and safe filename for exported PDFs.
 *
 * Prevents recursive "-edited-edited.pdf" chains.
 * Protects against path traversal, control characters, illegal filesystem characters,
 * and excessive length while preserving valid Unicode.
 */
export function getDeterministicExportFilename(
  originalFileName: string,
  customFileName?: string
): string {
  if (customFileName && customFileName.trim()) {
    let name = customFileName.trim();
    if (!name.toLowerCase().endsWith('.pdf')) {
      name += '.pdf';
    }
    return sanitizeDownloadFilename(name);
  }

  // Strip extension
  let base = (originalFileName || 'document.pdf').replace(/\.[^/.]+$/, '').trim();
  if (!base) base = 'document';

  // Strip pre-existing (-edited)+ suffixes case-insensitively
  base = base.replace(/(-edited)+$/i, '');
  if (!base) base = 'document';

  const finalRawName = `${base}-edited.pdf`;
  return sanitizeDownloadFilename(finalRawName);
}


function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function prepareImageBytes(
  dataUrl: string,
  sourceType: string
): Promise<{ bytes: Uint8Array; isJpg: boolean }> {
  if (sourceType === 'jpeg') {
    return { bytes: dataUrlToUint8Array(dataUrl), isJpg: true };
  }
  if (sourceType === 'png') {
    return { bytes: dataUrlToUint8Array(dataUrl), isJpg: false };
  }
  // WebP or other raster format: convert to PNG in browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = dataUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        return { bytes: dataUrlToUint8Array(pngUrl), isJpg: false };
      }
    } catch {
      // fallback to raw bytes
    }
  }
  return { bytes: dataUrlToUint8Array(dataUrl), isJpg: false };
}

function getStandardFontEnum(family: SupportedFontFamily, bold?: boolean, italic?: boolean): StandardFonts {
  if (family === 'TimesRoman') {
    if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
    if (bold) return StandardFonts.TimesRomanBold;
    if (italic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }
  if (family === 'Courier') {
    if (bold && italic) return StandardFonts.CourierBoldOblique;
    if (bold) return StandardFonts.CourierBold;
    if (italic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }
  // Helvetica
  if (bold && italic) return StandardFonts.HelveticaBoldOblique;
  if (bold) return StandardFonts.HelveticaBold;
  if (italic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

/**
 * Compiles the current EditorDocumentState into a valid, standalone PDF document.
 * Guarantees zero rasterization of pre-existing PDF content.
 */
export async function exportEditedPdf(
  state: EditorDocumentState,
  options?: EditorExportOptions
): Promise<EditorExportResult> {
  if (!state.sourceBytes || state.sourceBytes.byteLength === 0) {
    throw new Error('Cannot export: No source PDF document is loaded.');
  }
  if (state.pages.length === 0) {
    throw new Error('Cannot export: Document has no pages.');
  }

  // 1. Load original document without mutating original buffer
  options?.onProgress?.('Preparing document...', 15);
  const sourceDoc = await PDFDocument.load(state.sourceBytes, { ignoreEncryption: true });

  // 2. Create target document
  const outDoc = await PDFDocument.create();
  options?.onProgress?.('Processing pages & annotations...', 40);


  // 3. Pre-embed standard fonts & images cache
  const fontCache: Record<string, PDFFont> = {};
  async function getFont(family: SupportedFontFamily, bold?: boolean, italic?: boolean): Promise<PDFFont> {
    const key = `${family}_${Boolean(bold)}_${Boolean(italic)}`;
    if (fontCache[key]) {
      return fontCache[key];
    }
    const standardFont = getStandardFontEnum(family, bold, italic);
    const embedded = await outDoc.embedFont(standardFont);
    fontCache[key] = embedded;
    return embedded;
  }

  const imageCache = new Map<string, PDFImage>();

  // 4. Reconstruct pages in current visual order
  for (const pageState of state.pages) {
    const [copiedPage] = await outDoc.copyPages(sourceDoc, [pageState.originalPageIndex]);
    copiedPage.setRotation(degrees(pageState.rotation));
    outDoc.addPage(copiedPage);

    // 5. Draw all page annotations onto copied page
    for (const obj of pageState.objects) {
      switch (obj.type) {
        case 'text': {
          const font = await getFont(obj.fontFamily, obj.bold, obj.italic);
          let finalX = obj.x;
          let textWidth = 0;
          if (obj.align === 'center' || obj.align === 'right' || obj.underline) {
            try {
              textWidth = font.widthOfTextAtSize(obj.text, obj.fontSize);
            } catch {
              textWidth = obj.text.length * (obj.fontSize * 0.5);
            }
          }
          if (obj.align === 'center') {
            finalX = obj.x - textWidth / 2;
          } else if (obj.align === 'right') {
            finalX = obj.x - textWidth;
          }

          copiedPage.drawText(obj.text, {
            x: finalX,
            y: obj.y,
            size: obj.fontSize,
            font,
            color: toPdfColor(obj.color),
            opacity: obj.opacity,
            rotate: obj.rotation ? degrees(obj.rotation) : undefined,
          });

          if (obj.underline && obj.text.trim().length > 0) {
            const underlineY = obj.y - Math.max(1, obj.fontSize * 0.12);
            copiedPage.drawLine({
              start: { x: finalX, y: underlineY },
              end: { x: finalX + textWidth, y: underlineY },
              thickness: Math.max(0.75, obj.fontSize * 0.06),
              color: toPdfColor(obj.color),
              opacity: obj.opacity,
            });
          }
          break;
        }

        case 'highlight': {
          copiedPage.drawRectangle({
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            color: toPdfColor(obj.color, COLORS.YELLOW_HIGHLIGHT),
            opacity: obj.opacity,
          });
          break;
        }

        case 'drawing': {
          if (obj.points.length > 1) {
            const strokeColor = toPdfColor(obj.color);
            for (let i = 0; i < obj.points.length - 1; i++) {
              copiedPage.drawLine({
                start: obj.points[i],
                end: obj.points[i + 1],
                thickness: obj.strokeWidth,
                color: strokeColor,
                opacity: obj.opacity,
              });
            }
          }
          break;
        }

        case 'rectangle': {
          copiedPage.drawRectangle({
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            borderWidth: obj.strokeWidth,
            borderColor: toPdfColor(obj.strokeColor),
            color: obj.fillColor ? toPdfColor(obj.fillColor) : undefined,
            opacity: obj.opacity,
          });
          break;
        }

        case 'ellipse': {
          const centerX = obj.x + obj.width / 2;
          const centerY = obj.y + obj.height / 2;
          const xScale = Math.max(0.1, obj.width / 2);
          const yScale = Math.max(0.1, obj.height / 2);

          copiedPage.drawEllipse({
            x: centerX,
            y: centerY,
            xScale,
            yScale,
            borderWidth: obj.strokeWidth,
            borderColor: toPdfColor(obj.strokeColor),
            color: obj.fillColor ? toPdfColor(obj.fillColor) : undefined,
            opacity: obj.opacity,
          });
          break;
        }

        case 'line': {
          copiedPage.drawLine({
            start: obj.start,
            end: obj.end,
            thickness: obj.strokeWidth,
            color: toPdfColor(obj.strokeColor),
            opacity: obj.opacity,
          });
          break;
        }

        case 'arrow': {
          const strokeColor = toPdfColor(obj.strokeColor);
          // 1. Draw shaft line
          copiedPage.drawLine({
            start: obj.start,
            end: obj.end,
            thickness: obj.strokeWidth,
            color: strokeColor,
            opacity: obj.opacity,
          });

          // 2. Draw arrowhead at target endpoint
          const angle = Math.atan2(obj.end.y - obj.start.y, obj.end.x - obj.start.x);
          const headLength = obj.headLength ?? 12;
          const headAngle = Math.PI / 6; // 30 degrees

          const arrowP1 = {
            x: obj.end.x - headLength * Math.cos(angle - headAngle),
            y: obj.end.y - headLength * Math.sin(angle - headAngle),
          };
          const arrowP2 = {
            x: obj.end.x - headLength * Math.cos(angle + headAngle),
            y: obj.end.y - headLength * Math.sin(angle + headAngle),
          };

          copiedPage.drawLine({
            start: obj.end,
            end: arrowP1,
            thickness: obj.strokeWidth,
            color: strokeColor,
            opacity: obj.opacity,
          });
          copiedPage.drawLine({
            start: obj.end,
            end: arrowP2,
            thickness: obj.strokeWidth,
            color: strokeColor,
            opacity: obj.opacity,
          });
          break;
        }

        case 'image':
        case 'signature': {
          if (!obj.dataUrl) break;
          try {
            let pdfImg = imageCache.get(obj.dataUrl);
            if (!pdfImg) {
              const { bytes, isJpg } = await prepareImageBytes(obj.dataUrl, obj.sourceType);
              pdfImg = isJpg ? await outDoc.embedJpg(bytes) : await outDoc.embedPng(bytes);
              imageCache.set(obj.dataUrl, pdfImg);
            }
            copiedPage.drawImage(pdfImg, {
              x: obj.x,
              y: obj.y,
              width: obj.width,
              height: obj.height,
              opacity: obj.opacity,
              rotate: obj.rotation ? degrees(obj.rotation) : undefined,
            });
          } catch (imgErr) {
            console.warn(`Failed to embed ${obj.type} during PDF export:`, imgErr);
          }
          break;
        }
      }
    }
  }

  // 6. Apply document metadata if defined
  if (state.metadata) {
    if (state.metadata.title !== undefined) {
      outDoc.setTitle(state.metadata.title);
    }
    if (state.metadata.author !== undefined) {
      outDoc.setAuthor(state.metadata.author);
    }
    if (state.metadata.subject !== undefined) {
      outDoc.setSubject(state.metadata.subject);
    }
    if (state.metadata.keywords !== undefined && Array.isArray(state.metadata.keywords)) {
      outDoc.setKeywords(state.metadata.keywords);
    }
    if (state.metadata.creator !== undefined) {
      outDoc.setCreator(state.metadata.creator);
    }
    if (state.metadata.producer !== undefined) {
      outDoc.setProducer(state.metadata.producer);
    }
    outDoc.setModificationDate(new Date());
  }

  // 7. Save modified PDF bytes
  options?.onProgress?.('Finalizing PDF...', 80);
  const outBytes = await outDoc.save();

  // 8. Validate output structure and page count
  options?.onProgress?.('Validating output...', 92);
  await assertValidPdfOutput(outBytes, { expectedPages: state.pages.length });

  const finalName = getDeterministicExportFilename(state.fileName, options?.outputFileName);

  const blob = new Blob(
    [outBytes.buffer.slice(outBytes.byteOffset, outBytes.byteOffset + outBytes.byteLength) as ArrayBuffer],
    { type: 'application/pdf' }
  );

  options?.onProgress?.('Ready', 100);

  return {
    blob,
    uint8Array: outBytes,
    totalPages: state.pages.length,
    fileSize: outBytes.byteLength,
    fileName: finalName,
  };
}

