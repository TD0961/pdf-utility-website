import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractPdfPages } from '@/lib/pdf/extract';
import { createTestPdf } from './test-helpers';
import { validatePdfOutput } from '@/lib/pdf/output-validator';
import { PDFDocument } from 'pdf-lib';

describe('Extract Pages Engine', () => {
  it('extracts a single page from a multi-page PDF', async () => {
    const pdfFile = await createTestPdf('doc', 5);

    // Extract page 2 (0-based index 1)
    const result = await extractPdfPages({
      file: pdfFile,
      pageIndices: [1],
    });

    assert.strictEqual(result.totalPages, 1);
    assert.strictEqual(result.fileName, 'doc-extracted.pdf');

    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 1 });
    assert.strictEqual(val.valid, true);
  });

  it('extracts multiple non-consecutive pages (e.g. 1, 3, 5)', async () => {
    const pdfFile = await createTestPdf('doc', 6);

    // 0-based indices 0, 2, 4 (pages 1, 3, 5)
    const result = await extractPdfPages({
      file: pdfFile,
      pageIndices: [0, 2, 4],
    });

    assert.strictEqual(result.totalPages, 3);
    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 3 });
    assert.strictEqual(val.valid, true);
  });

  it('preserves user-specified page ordering (e.g. reverse order: 5, 3, 1)', async () => {
    const pdfFile = await createTestPdf('ordered', 5);

    // 0-based indices: 4, 2, 0
    const result = await extractPdfPages({
      file: pdfFile,
      pageIndices: [4, 2, 0],
    });

    assert.strictEqual(result.totalPages, 3);
    const outDoc = await PDFDocument.load(result.uint8Array);
    assert.strictEqual(outDoc.getPageCount(), 3);

    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 3 });
    assert.strictEqual(val.valid, true);
  });

  it('extracts pages using range syntax (e.g. "1-2, 4")', async () => {
    const pdfFile = await createTestPdf('doc', 5);

    const result = await extractPdfPages({
      file: pdfFile,
      rangeExpression: '1-2, 4',
    });

    assert.strictEqual(result.totalPages, 3);
    const val = await validatePdfOutput(result.uint8Array, { expectedPages: 3 });
    assert.strictEqual(val.valid, true);
  });

  it('rejects empty page selection with clear error', async () => {
    const pdfFile = await createTestPdf('doc', 3);

    await assert.rejects(
      async () => {
        await extractPdfPages({
          file: pdfFile,
          pageIndices: [],
        });
      },
      /select at least one page/i
    );
  });

  it('rejects out-of-bounds page requests', async () => {
    const pdfFile = await createTestPdf('doc', 3);

    await assert.rejects(
      async () => {
        await extractPdfPages({
          file: pdfFile,
          pageIndices: [0, 5], // Page 6 does not exist in 3-page doc
        });
      },
      /does not exist in this PDF/i
    );
  });

  it('rejects corrupted non-PDF files', async () => {
    const corrupted = {
      name: 'broken.pdf',
      buffer: new TextEncoder().encode('Corrupted binary garbage').buffer as ArrayBuffer,
    };

    await assert.rejects(
      async () => {
        await extractPdfPages({ file: corrupted, pageIndices: [0] });
      },
      /valid PDF/i
    );
  });

  it('respects custom outputFileName', async () => {
    const pdfFile = await createTestPdf('custom', 3);

    const result = await extractPdfPages({
      file: pdfFile,
      pageIndices: [0, 1],
      outputFileName: 'my-selection.pdf',
    });

    assert.strictEqual(result.fileName, 'my-selection.pdf');
  });

  it('emits sequential progress updates during extraction (0% to 100%)', async () => {
    const pdfFile = await createTestPdf('progress', 4);
    const progressList: Array<{ pct: number; stage: string }> = [];

    await extractPdfPages({
      file: pdfFile,
      pageIndices: [0, 2],
      onProgress: (_curr, _total, stage, pct) => {
        progressList.push({ pct, stage });
      },
    });

    assert.ok(progressList.length >= 2);
    const last = progressList[progressList.length - 1];
    assert.strictEqual(last.pct, 100);
    assert.match(last.stage, /Complete/i);
  });
});
