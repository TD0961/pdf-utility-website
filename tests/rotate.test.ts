import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rotatePdfDocument } from '@/lib/pdf/rotate';
import { createTestPdf } from './test-helpers';
import { validatePdfOutput } from '@/lib/pdf/output-validator';
import { PDFDocument, degrees } from 'pdf-lib';

describe('Rotate PDF Engine', () => {
  it('rotates a single page by 90 degrees clockwise', async () => {
    const pdfFile = await createTestPdf('single', 1);

    const result = await rotatePdfDocument({
      file: pdfFile,
      rotations: [{ pageIndex: 0, deltaRotation: 90 }],
    });

    assert.strictEqual(result.totalPages, 1);
    assert.strictEqual(result.fileName, 'single-rotated.pdf');

    const outDoc = await PDFDocument.load(result.uint8Array);
    assert.strictEqual(outDoc.getPage(0).getRotation().angle, 90);

    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 1 });
    assert.strictEqual(val.valid, true);
  });

  it('rotates all pages using the allPagesDelta shortcut', async () => {
    const pdfFile = await createTestPdf('multi', 3);

    const result = await rotatePdfDocument({
      file: pdfFile,
      allPagesDelta: 180,
    });

    assert.strictEqual(result.totalPages, 3);
    const outDoc = await PDFDocument.load(result.uint8Array);

    for (let i = 0; i < 3; i++) {
      assert.strictEqual(outDoc.getPage(i).getRotation().angle, 180);
    }
  });

  it('rotates only selected pages leaving non-target pages unchanged', async () => {
    const pdfFile = await createTestPdf('mixed-target', 4);

    const result = await rotatePdfDocument({
      file: pdfFile,
      rotations: [
        { pageIndex: 1, deltaRotation: 90 },
        { pageIndex: 3, deltaRotation: 270 },
      ],
    });

    const outDoc = await PDFDocument.load(result.uint8Array);
    assert.strictEqual(outDoc.getPage(0).getRotation().angle, 0, 'Page 0 should remain 0°');
    assert.strictEqual(outDoc.getPage(1).getRotation().angle, 90, 'Page 1 should be 90°');
    assert.strictEqual(outDoc.getPage(2).getRotation().angle, 0, 'Page 2 should remain 0°');
    assert.strictEqual(outDoc.getPage(3).getRotation().angle, 270, 'Page 3 should be 270°');
  });

  it('correctly computes cumulative rotation on pages with pre-existing /Rotate metadata', async () => {
    // Create PDF with pre-existing rotation metadata: Page 0 = 90°, Page 1 = 180°, Page 2 = 270°
    const doc = await PDFDocument.create();
    const p0 = doc.addPage([400, 400]);
    p0.setRotation(degrees(90));
    const p1 = doc.addPage([400, 400]);
    p1.setRotation(degrees(180));
    const p2 = doc.addPage([400, 400]);
    p2.setRotation(degrees(270));

    const initialBytes = await doc.save();

    // Apply +90° to all
    const result = await rotatePdfDocument({
      file: { name: 'pre-rotated.pdf', buffer: initialBytes.buffer as ArrayBuffer },
      allPagesDelta: 90,
    });

    const outDoc = await PDFDocument.load(result.uint8Array);
    // 90 + 90 = 180
    assert.strictEqual(outDoc.getPage(0).getRotation().angle, 180);
    // 180 + 90 = 270
    assert.strictEqual(outDoc.getPage(1).getRotation().angle, 270);
    // 270 + 90 = 360 -> 0
    assert.strictEqual(outDoc.getPage(2).getRotation().angle, 0);
  });

  it('handles negative rotation deltas (e.g. -90° / rotate left)', async () => {
    const doc = await PDFDocument.create();
    const p0 = doc.addPage([400, 400]);
    p0.setRotation(degrees(0));
    const initialBytes = await doc.save();

    const result = await rotatePdfDocument({
      file: { name: 'rotate-left.pdf', buffer: initialBytes.buffer as ArrayBuffer },
      rotations: [{ pageIndex: 0, deltaRotation: -90 }],
    });

    const outDoc = await PDFDocument.load(result.uint8Array);
    // 0 - 90 = 270
    assert.strictEqual(outDoc.getPage(0).getRotation().angle, 270);
  });

  it('validates output PDF and ensures page count remains strictly unchanged', async () => {
    const pdfFile = await createTestPdf('validation-check', 5);

    const result = await rotatePdfDocument({
      file: pdfFile,
      allPagesDelta: 90,
    });

    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 5 });
    assert.strictEqual(val.valid, true);
    assert.strictEqual(val.pageCount, 5);
  });

  it('respects custom outputFileName', async () => {
    const pdfFile = await createTestPdf('custom-name', 2);

    const result = await rotatePdfDocument({
      file: pdfFile,
      allPagesDelta: 90,
      outputFileName: 'my-custom-rotated.pdf',
    });

    assert.strictEqual(result.fileName, 'my-custom-rotated.pdf');
  });

  it('rejects corrupted non-PDF files with a clear error', async () => {
    const corrupted = {
      name: 'bad.pdf',
      buffer: new TextEncoder().encode('Corrupted binary garbage').buffer as ArrayBuffer,
    };

    await assert.rejects(
      async () => {
        await rotatePdfDocument({ file: corrupted, allPagesDelta: 90 });
      },
      /valid PDF/i
    );
  });

  it('emits sequential progress callbacks (0% to 100%)', async () => {
    const pdfFile = await createTestPdf('progress', 3);
    const progressList: Array<{ pct: number; stage: string }> = [];

    await rotatePdfDocument({
      file: pdfFile,
      allPagesDelta: 90,
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
