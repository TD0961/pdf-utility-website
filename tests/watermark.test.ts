import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  watermarkPdf,
  computeWatermarkCoords,
  WatermarkPosition,
} from '@/lib/pdf/watermark';
import { createTestPdf } from './test-helpers';
import { validatePdfOutput } from '@/lib/pdf/output-validator';
import { PDFDocument, degrees } from 'pdf-lib';
import { getPdfJs } from '@/lib/pdf/pdf-renderer';

interface PdfJsTextItem {
  str?: string;
}

function hasTextItem(items: unknown[], predicate: (str: string) => boolean): boolean {
  return items.some((item) => {
    const textItem = item as PdfJsTextItem;
    return Boolean(textItem.str && predicate(textItem.str));
  });
}

describe('Watermark PDF Engine', () => {
  it('adds default text watermark (diagonal center, CONFIDENTIAL) across all pages', async () => {
    const pdfFile = await createTestPdf('doc', 3);

    const result = await watermarkPdf({
      file: pdfFile,
      text: 'CONFIDENTIAL',
    });

    assert.strictEqual(result.totalPages, 3);
    assert.strictEqual(result.fileName, 'doc-watermarked.pdf');

    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 3 });
    assert.strictEqual(val.valid, true);

    // Verify text presence with PDF.js
    const pdfjs = await getPdfJs();
    const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(result.uint8Array) }).promise;

    for (let i = 1; i <= 3; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const hasWatermark = hasTextItem(textContent.items, (str) => str.includes('CONFIDENTIAL'));
      assert.ok(hasWatermark, `Page ${i} should contain the CONFIDENTIAL watermark`);
    }
  });

  it('supports custom text, font size, opacity, and color', async () => {
    const pdfFile = await createTestPdf('custom-style', 2);

    const result = await watermarkPdf({
      file: pdfFile,
      text: 'DRAFT COPY',
      fontSize: 60,
      opacity: 0.5,
      color: 'red',
    });

    assert.strictEqual(result.totalPages, 2);
    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 2 });
    assert.strictEqual(val.valid, true);

    const pdfjs = await getPdfJs();
    const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(result.uint8Array) }).promise;
    const p1 = await pdfDoc.getPage(1);
    const tc1 = await p1.getTextContent();
    assert.ok(hasTextItem(tc1.items, (str) => str.includes('DRAFT COPY')));
  });

  it('supports all position presets and tiled repeating pattern', async () => {
    const positions: WatermarkPosition[] = [
      'center',
      'top-left',
      'top-center',
      'top-right',
      'middle-left',
      'middle-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
      'tiled',
    ];

    const pdfFile = await createTestPdf('pos-test', 1);

    for (const pos of positions) {
      const result = await watermarkPdf({
        file: pdfFile,
        text: 'SAMPLE',
        position: pos,
      });

      assert.strictEqual(result.totalPages, 1);
      const val = await validatePdfOutput(result.uint8Array, { expectedPages: 1 });
      assert.strictEqual(val.valid, true, `Position ${pos} should produce valid PDF`);
    }
  });

  it('supports custom rotation angles', async () => {
    const pdfFile = await createTestPdf('rot-angle', 1);

    for (const angle of [0, 30, 45, 90, 180]) {
      const result = await watermarkPdf({
        file: pdfFile,
        text: 'ANGLE',
        rotation: angle,
      });

      assert.strictEqual(result.totalPages, 1);
      const val = await validatePdfOutput(result.uint8Array, { expectedPages: 1 });
      assert.strictEqual(val.valid, true);
    }
  });

  it('watermarks only a specific range of pages (e.g. 2-3 of a 3-page document)', async () => {
    const pdfFile = await createTestPdf('range-doc', 3);

    const result = await watermarkPdf({
      file: pdfFile,
      text: 'CONFIDENTIAL',
      pages: '2-3',
    });

    const pdfjs = await getPdfJs();
    const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(result.uint8Array) }).promise;

    // Page 1 should NOT contain CONFIDENTIAL
    const p1 = await pdfDoc.getPage(1);
    const tc1 = await p1.getTextContent();
    assert.strictEqual(
      hasTextItem(tc1.items, (str) => str.includes('CONFIDENTIAL')),
      false,
      'Page 1 should be omitted from watermarking'
    );

    // Page 2 should contain CONFIDENTIAL
    const p2 = await pdfDoc.getPage(2);
    const tc2 = await p2.getTextContent();
    assert.ok(
      hasTextItem(tc2.items, (str) => str.includes('CONFIDENTIAL')),
      'Page 2 should be watermarked'
    );
  });

  it('handles documents with mixed page dimensions', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([595.28, 841.89]); // A4 portrait
    doc.addPage([841.89, 595.28]); // A4 landscape
    doc.addPage([612, 1008]); // US Legal
    const initialBytes = await doc.save();

    const result = await watermarkPdf({
      file: { name: 'mixed-dims.pdf', buffer: initialBytes.buffer as ArrayBuffer },
      text: 'MIXED',
      position: 'center',
    });

    assert.strictEqual(result.totalPages, 3);
    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 3 });
    assert.strictEqual(val.valid, true);
  });

  it('accurately calculates coordinate transformations across 0°, 90°, 180°, and 270° rotations', () => {
    const W = 400;
    const H = 600;
    const visualCenter = { cxv: 200, cyv: 300 };
    const textW = 100;
    const textH = 20;

    // 0 deg page rotation, 0 deg visual angle
    const c0 = computeWatermarkCoords(W, H, 0, visualCenter, textW, textH, 0);
    assert.strictEqual(c0.textRotate, 0);
    assert.strictEqual(c0.x, 200 - textW / 2);
    assert.strictEqual(c0.y, 300 - textH / 2);

    // 90 deg page rotation, 0 deg visual angle -> textRotate should be 90 to counteract viewer
    const c90 = computeWatermarkCoords(W, H, 90, visualCenter, textW, textH, 0);
    assert.strictEqual(c90.textRotate, 90);

    // 180 deg page rotation
    const c180 = computeWatermarkCoords(W, H, 180, visualCenter, textW, textH, 0);
    assert.strictEqual(c180.textRotate, 180);

    // 270 deg page rotation
    const c270 = computeWatermarkCoords(W, H, 270, visualCenter, textW, textH, 0);
    assert.strictEqual(c270.textRotate, 270);
  });

  it('watermarks documents containing pre-rotated pages without error', async () => {
    const doc = await PDFDocument.create();
    const p1 = doc.addPage([400, 600]);
    p1.setRotation(degrees(0));
    const p2 = doc.addPage([400, 600]);
    p2.setRotation(degrees(90));
    const p3 = doc.addPage([400, 600]);
    p3.setRotation(degrees(180));
    const p4 = doc.addPage([400, 600]);
    p4.setRotation(degrees(270));
    const initialBytes = await doc.save();

    const result = await watermarkPdf({
      file: { name: 'rotated.pdf', buffer: initialBytes.buffer as ArrayBuffer },
      text: 'ROTATED',
      position: 'center',
    });

    assert.strictEqual(result.totalPages, 4);
    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 4 });
    assert.strictEqual(val.valid, true);
  });

  it('rejects empty watermark text with clear error', async () => {
    const pdfFile = await createTestPdf('doc', 1);

    await assert.rejects(
      async () => {
        await watermarkPdf({ file: pdfFile, text: '   ' });
      },
      /provide watermark text/i
    );
  });

  it('rejects corrupted non-PDF files', async () => {
    const corrupted = {
      name: 'corrupt.pdf',
      buffer: new TextEncoder().encode('Not a valid PDF file').buffer as ArrayBuffer,
    };

    await assert.rejects(
      async () => {
        await watermarkPdf({ file: corrupted, text: 'TEST' });
      },
      /valid PDF/i
    );
  });

  it('respects custom outputFileName', async () => {
    const pdfFile = await createTestPdf('custom-out', 1);

    const result = await watermarkPdf({
      file: pdfFile,
      text: 'BRAND',
      outputFileName: 'my-branded.pdf',
    });

    assert.strictEqual(result.fileName, 'my-branded.pdf');
  });

  it('emits sequential progress callbacks (0% to 100%)', async () => {
    const pdfFile = await createTestPdf('progress', 3);
    const progressList: Array<{ pct: number; stage: string }> = [];

    await watermarkPdf({
      file: pdfFile,
      text: 'PROGRESS',
      onProgress: (_curr, _total, stage, pct) => {
        progressList.push({ pct, stage });
      },
    });

    assert.ok(progressList.length >= 3);
    const last = progressList[progressList.length - 1];
    assert.strictEqual(last.pct, 100);
  });
});
