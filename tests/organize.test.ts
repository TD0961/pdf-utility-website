import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { organizePdfDocument } from '../src/lib/pdf/organize';
import { createTestPdf } from './test-helpers';

describe('Organize PDF Engine', () => {
  it('reorders pages from [0, 1, 2, 3] to [0, 3, 1, 2]', async () => {
    const doc = await createTestPdf('TestDoc', 4);

    // Reorder: Page 1, Page 4, Page 2, Page 3
    const instructions = [
      { id: '1', originalIndex: 0, rotation: 0 },
      { id: '4', originalIndex: 3, rotation: 0 },
      { id: '2', originalIndex: 1, rotation: 0 },
      { id: '3', originalIndex: 2, rotation: 0 },
    ];

    const result = await organizePdfDocument({
      file: doc,
      pages: instructions,
    });

    assert.equal(result.totalPages, 4);
    const parsed = await PDFDocument.load(result.uint8Array);
    assert.equal(parsed.getPageCount(), 4);
  });

  it('deletes page 2 from [0, 1, 2, 3] resulting in 3 pages [0, 2, 3]', async () => {
    const doc = await createTestPdf('TestDoc', 4);

    const instructions = [
      { id: '1', originalIndex: 0, rotation: 0 },
      { id: '3', originalIndex: 2, rotation: 0 },
      { id: '4', originalIndex: 3, rotation: 0 },
    ];

    const result = await organizePdfDocument({
      file: doc,
      pages: instructions,
    });

    assert.equal(result.totalPages, 3);
    const parsed = await PDFDocument.load(result.uint8Array);
    assert.equal(parsed.getPageCount(), 3);
  });

  it('duplicates page 2 from [0, 1, 2] to produce [0, 1, 1, 2]', async () => {
    const doc = await createTestPdf('TestDoc', 3);

    const instructions = [
      { id: '1', originalIndex: 0, rotation: 0 },
      { id: '2-orig', originalIndex: 1, rotation: 0 },
      { id: '2-copy', originalIndex: 1, rotation: 0 },
      { id: '3', originalIndex: 2, rotation: 0 },
    ];

    const result = await organizePdfDocument({
      file: doc,
      pages: instructions,
    });

    assert.equal(result.totalPages, 4);
    const parsed = await PDFDocument.load(result.uint8Array);
    assert.equal(parsed.getPageCount(), 4);
  });

  it('permanently sets page rotation metadata in the output PDF', async () => {
    const doc = await createTestPdf('TestDoc', 2);

    const instructions = [
      { id: '1', originalIndex: 0, rotation: 90 },
      { id: '2', originalIndex: 1, rotation: 180 },
    ];

    const result = await organizePdfDocument({
      file: doc,
      pages: instructions,
    });

    const parsed = await PDFDocument.load(result.uint8Array);
    const pages = parsed.getPages();
    assert.equal(pages[0].getRotation().angle, 90);
    assert.equal(pages[1].getRotation().angle, 180);
  });

  it('rejects empty page instructions', async () => {
    const doc = await createTestPdf('TestDoc', 3);

    await assert.rejects(
      async () => {
        await organizePdfDocument({
          file: doc,
          pages: [],
        });
      },
      /A PDF must contain at least one page/
    );
  });

  it('rejects invalid out-of-bounds page references', async () => {
    const doc = await createTestPdf('TestDoc', 2);

    await assert.rejects(
      async () => {
        await organizePdfDocument({
          file: doc,
          pages: [{ id: 'bad', originalIndex: 5, rotation: 0 }],
        });
      },
      /Invalid page reference/
    );
  });

  it('correctly handles full multi-operation sequence: duplicate, rotate, and delete', async () => {
    const doc = await createTestPdf('TestDoc', 3); // 3 pages: 0, 1, 2

    // Instructions: Duplicate page 0 twice (one rotated 90, one 270), delete page 1, keep page 2 rotated 180
    const instructions = [
      { id: 'p0-a', originalIndex: 0, rotation: 90 },
      { id: 'p0-b', originalIndex: 0, rotation: 270 },
      { id: 'p2', originalIndex: 2, rotation: 180 },
    ];

    const result = await organizePdfDocument({
      file: doc,
      pages: instructions,
      outputFileName: 'multi-op.pdf',
    });

    assert.equal(result.totalPages, 3);
    assert.equal(result.fileName, 'multi-op.pdf');

    const reloaded = await PDFDocument.load(result.uint8Array);
    const pages = reloaded.getPages();
    assert.equal(pages[0].getRotation().angle, 90);
    assert.equal(pages[1].getRotation().angle, 270);
    assert.equal(pages[2].getRotation().angle, 180);
  });
});
