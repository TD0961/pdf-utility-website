/**
 * Phase 3C.1: PDF Editor Engine — Export Engine
 * High-fidelity, client-side PDF export without rasterization.
 * Preserves original text, vector paths, and document links using pdf-lib copyPages,
 * and compiles newly added editor annotations and vector shapes into native PDF streams.
 */

import { PDFDocument, StandardFonts, rgb, degrees, PDFFont } from 'pdf-lib';
import { EditorDocumentState, EditorExportResult, SupportedFontFamily } from './types';
import { assertValidPdfOutput } from '../output-validator';
import { sanitizeDownloadFilename } from '@/lib/validation/file-validator';

export interface EditorExportOptions {
  outputFileName?: string;
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
  const sourceDoc = await PDFDocument.load(state.sourceBytes, { ignoreEncryption: true });

  // 2. Create target document
  const outDoc = await PDFDocument.create();

  // 3. Pre-embed standard fonts for text annotations
  const fontCache: Partial<Record<SupportedFontFamily, PDFFont>> = {};
  async function getFont(family: SupportedFontFamily): Promise<PDFFont> {
    if (fontCache[family]) {
      return fontCache[family]!;
    }
    let standardFont: StandardFonts;
    switch (family) {
      case 'TimesRoman':
        standardFont = StandardFonts.TimesRoman;
        break;
      case 'Courier':
        standardFont = StandardFonts.Courier;
        break;
      case 'Helvetica':
      default:
        standardFont = StandardFonts.Helvetica;
        break;
    }
    const embedded = await outDoc.embedFont(standardFont);
    fontCache[family] = embedded;
    return embedded;
  }

  // 4. Reconstruct pages in current visual order
  for (const pageState of state.pages) {
    const [copiedPage] = await outDoc.copyPages(sourceDoc, [pageState.originalPageIndex]);
    copiedPage.setRotation(degrees(pageState.rotation));
    outDoc.addPage(copiedPage);

    // 5. Draw all page annotations onto copied page
    for (const obj of pageState.objects) {
      switch (obj.type) {
        case 'text': {
          const font = await getFont(obj.fontFamily);
          copiedPage.drawText(obj.text, {
            x: obj.x,
            y: obj.y,
            size: obj.fontSize,
            font,
            color: rgb(obj.color.r, obj.color.g, obj.color.b),
            opacity: obj.opacity,
            rotate: obj.rotation ? degrees(obj.rotation) : undefined,
          });
          break;
        }

        case 'highlight': {
          copiedPage.drawRectangle({
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            color: rgb(obj.color.r, obj.color.g, obj.color.b),
            opacity: obj.opacity,
          });
          break;
        }

        case 'drawing': {
          if (obj.points.length > 1) {
            const strokeColor = rgb(obj.color.r, obj.color.g, obj.color.b);
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
            borderColor: rgb(obj.strokeColor.r, obj.strokeColor.g, obj.strokeColor.b),
            color: obj.fillColor ? rgb(obj.fillColor.r, obj.fillColor.g, obj.fillColor.b) : undefined,
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
            borderColor: rgb(obj.strokeColor.r, obj.strokeColor.g, obj.strokeColor.b),
            color: obj.fillColor ? rgb(obj.fillColor.r, obj.fillColor.g, obj.fillColor.b) : undefined,
            opacity: obj.opacity,
          });
          break;
        }

        case 'line': {
          copiedPage.drawLine({
            start: obj.start,
            end: obj.end,
            thickness: obj.strokeWidth,
            color: rgb(obj.strokeColor.r, obj.strokeColor.g, obj.strokeColor.b),
            opacity: obj.opacity,
          });
          break;
        }

        case 'arrow': {
          const strokeColor = rgb(obj.strokeColor.r, obj.strokeColor.g, obj.strokeColor.b);
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
      }
    }
  }

  // 6. Save modified PDF bytes
  const outBytes = await outDoc.save();

  // 7. Validate output structure and page count
  await assertValidPdfOutput(outBytes, { expectedPages: state.pages.length });

  const defaultName = state.fileName.replace(/\.[^/.]+$/, '') + '-edited.pdf';
  const finalName = sanitizeDownloadFilename(options?.outputFileName || defaultName);
  const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  return {
    blob,
    uint8Array: outBytes,
    totalPages: state.pages.length,
    fileSize: outBytes.byteLength,
    fileName: finalName,
  };
}
