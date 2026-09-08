import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addPageNumbersToPdf,
  computePageNumberCoords,
  formatPageNumberText,
  PageNumberPosition,
} from '@/lib/pdf/page-numbers';
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

describe('Add Page Numbers Engine', () => {
  it('adds default page numbers (bottom-center, numeric) to all pages of a PDF', async () => {
    const pdfFile = await createTestPdf('doc', 3);

    const result = await addPageNumbersToPdf({
      file: pdfFile,
      position: 'bottom-center',
      format: 'numeric',
    });

    assert.strictEqual(result.totalPages, 3);
    assert.strictEqual(result.fileName, 'doc-numbered.pdf');

    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 3 });
    assert.strictEqual(val.valid, true);

    // Verify text content using PDF.js
    const pdfjs = await getPdfJs();
    const pdfDoc = await (pdfjs.getDocument({ data: new Uint8Array(result.uint8Array) })).promise;

    for (let i = 1; i <= 3; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const hasNumber = hasTextItem(textContent.items, (str) => str.trim() === String(i));
      assert.ok(hasNumber, `Page ${i} should contain number ${i}`);
    }
  });

  it('supports all position presets without error', async () => {
    const positions: PageNumberPosition[] = [
      'bottom-center',
      'bottom-left',
      'bottom-right',
      'top-center',
      'top-left',
      'top-right',
      'middle-left',
      'middle-right',
    ];

    const pdfFile = await createTestPdf('pos-doc', 1);

    for (const pos of positions) {
      const result = await addPageNumbersToPdf({
        file: pdfFile,
        position: pos,
      });

      assert.strictEqual(result.totalPages, 1);
      const val = await validatePdfOutput(result.uint8Array, { expectedPages: 1 });
      assert.strictEqual(val.valid, true);
    }
  });

  it('formats page numbers as prefixed, total, and prefixed-total correctly', async () => {
    assert.strictEqual(formatPageNumberText(1, 10, 'numeric'), '1');
    assert.strictEqual(formatPageNumberText(2, 10, 'prefixed'), 'Page 2');
    assert.strictEqual(formatPageNumberText(3, 10, 'total'), '3 / 10');
    assert.strictEqual(formatPageNumberText(4, 10, 'prefixed-total'), 'Page 4 of 10');

    // Test in-document application
    const pdfFile = await createTestPdf('formatted', 2);
    const result = await addPageNumbersToPdf({
      file: pdfFile,
      format: 'prefixed-total',
    });

    const pdfjs = await getPdfJs();
    const pdfDoc = await (pdfjs.getDocument({ data: new Uint8Array(result.uint8Array) })).promise;

    const p1 = await pdfDoc.getPage(1);
    const tc1 = await p1.getTextContent();
    assert.ok(hasTextItem(tc1.items, (str) => str.includes('Page 1 of 2')));
  });

  it('applies custom starting number offset (e.g. start at 5)', async () => {
    const pdfFile = await createTestPdf('offset', 2);

    const result = await addPageNumbersToPdf({
      file: pdfFile,
      startNumber: 5,
    });

    const pdfjs = await getPdfJs();
    const pdfDoc = await (pdfjs.getDocument({ data: new Uint8Array(result.uint8Array) })).promise;

    const p1 = await pdfDoc.getPage(1);
    const tc1 = await p1.getTextContent();
    assert.ok(hasTextItem(tc1.items, (str) => str.trim() === '5'));

    const p2 = await pdfDoc.getPage(2);
    const tc2 = await p2.getTextContent();
    assert.ok(hasTextItem(tc2.items, (str) => str.trim() === '6'));
  });

  it('numbers only a specific range of pages (e.g. 2-3 of a 3-page document)', async () => {
    const pdfFile = await createTestPdf('range-test', 3);

    const result = await addPageNumbersToPdf({
      file: pdfFile,
      pages: '2-3',
    });

    const pdfjs = await getPdfJs();
    const pdfDoc = await (pdfjs.getDocument({ data: new Uint8Array(result.uint8Array) })).promise;

    // Page 1 should NOT have page number 1
    const p1 = await pdfDoc.getPage(1);
    const tc1 = await p1.getTextContent();
    const p1HasNumber = hasTextItem(tc1.items, (str) => str.trim() === '1');
    assert.strictEqual(p1HasNumber, false, 'Page 1 should be omitted from numbering');

    // Page 2 should have number 1 (or sequential based on startNumber)
    const p2 = await pdfDoc.getPage(2);
    const tc2 = await p2.getTextContent();
    const p2HasNumber = hasTextItem(tc2.items, (str) => str.trim() === '1');
    assert.strictEqual(p2HasNumber, true, 'Page 2 should be numbered');
  });

  it('accurately calculates coordinate transformations across 0°, 90°, 180°, and 270° rotations', () => {
    const W = 400;
    const H = 600;
    const visualPos = { xv: 200, yv: 30 }; // visual bottom-center

    // 0 deg: x = xv, y = yv
    const c0 = computePageNumberCoords(W, H, 0, visualPos);
    assert.strictEqual(c0.x, 200);
    assert.strictEqual(c0.y, 30);
    assert.strictEqual(c0.textRotate, 0);

    // 90 deg: x = W - yv, y = xv
    const c90 = computePageNumberCoords(W, H, 90, visualPos);
    assert.strictEqual(c90.x, 370);
    assert.strictEqual(c90.y, 200);
    assert.strictEqual(c90.textRotate, 90);

    // 180 deg: x = W - xv, y = H - yv
    const c180 = computePageNumberCoords(W, H, 180, visualPos);
    assert.strictEqual(c180.x, 200);
    assert.strictEqual(c180.y, 570);
    assert.strictEqual(c180.textRotate, 180);

    // 270 deg: x = yv, y = H - xv
    const c270 = computePageNumberCoords(W, H, 270, visualPos);
    assert.strictEqual(c270.x, 30);
    assert.strictEqual(c270.y, 400);
    assert.strictEqual(c270.textRotate, 270);
  });

  it('correctly numbers documents containing rotated pages without throwing errors', async () => {
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

    const result = await addPageNumbersToPdf({
      file: { name: 'mixed-rot.pdf', buffer: initialBytes.buffer as ArrayBuffer },
      position: 'bottom-center',
      format: 'numeric',
    });

    assert.strictEqual(result.totalPages, 4);
    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 4 });
    assert.strictEqual(val.valid, true);
  });

  it('rejects corrupted non-PDF files', async () => {
    const corrupted = {
      name: 'corrupt.pdf',
      buffer: new TextEncoder().encode('Corrupted binary data').buffer as ArrayBuffer,
    };

    await assert.rejects(
      async () => {
        await addPageNumbersToPdf({ file: corrupted });
      },
      /valid PDF/i
    );
  });

  it('respects custom outputFileName', async () => {
    const pdfFile = await createTestPdf('custom', 1);

    const result = await addPageNumbersToPdf({
      file: pdfFile,
      outputFileName: 'stamped.pdf',
    });

    assert.strictEqual(result.fileName, 'stamped.pdf');
  });

  it('emits sequential progress callbacks (0% to 100%)', async () => {
    const pdfFile = await createTestPdf('progress', 3);
    const progressList: Array<{ pct: number; stage: string }> = [];

    await addPageNumbersToPdf({
      file: pdfFile,
      onProgress: (_curr, _total, stage, pct) => {
        progressList.push({ pct, stage });
      },
    });

    assert.ok(progressList.length >= 3);
    const last = progressList[progressList.length - 1];
    assert.strictEqual(last.pct, 100);
    assert.match(last.stage, /Complete/i);
  });
});
