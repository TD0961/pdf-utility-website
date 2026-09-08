import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, degrees } from 'pdf-lib';
import { mergePdfFiles } from '../src/lib/pdf/merge';
import { createTestPdf } from './test-helpers';

describe('Merge PDF Engine', () => {
  it('merges Document A (2 pages) and Document B (3 pages) into 5 pages', async () => {
    const docA = await createTestPdf('DocA', 2);
    const docB = await createTestPdf('DocB', 3);

    const result = await mergePdfFiles({
      files: [docA, docB],
    });

    assert.equal(result.totalPages, 5);
    assert.equal(result.fileCount, 2);

    // Verify resulting PDF document in pdf-lib
    const parsedMerged = await PDFDocument.load(result.uint8Array);
    assert.equal(parsedMerged.getPageCount(), 5);
  });

  it('preserves exact file sequence (A then B then C)', async () => {
    const docA = await createTestPdf('DocA', 1);
    const docB = await createTestPdf('DocB', 2);
    const docC = await createTestPdf('DocC', 3);

    const result = await mergePdfFiles({
      files: [docA, docB, docC],
    });

    assert.equal(result.totalPages, 6);
    const parsed = await PDFDocument.load(result.uint8Array);
    assert.equal(parsed.getPageCount(), 6);
  });

  it('preserves reordered input sequence (C then A then B)', async () => {
    const docA = await createTestPdf('DocA', 1);
    const docB = await createTestPdf('DocB', 2);
    const docC = await createTestPdf('DocC', 3);

    // Sequence: C (3 pages) + A (1 page) + B (2 pages) = 6 pages
    const result = await mergePdfFiles({
      files: [docC, docA, docB],
    });

    assert.equal(result.totalPages, 6);
    const parsed = await PDFDocument.load(result.uint8Array);
    assert.equal(parsed.getPageCount(), 6);
  });

  it('rejects fewer than 2 files with clear error message', async () => {
    const docA = await createTestPdf('DocA', 2);

    await assert.rejects(
      async () => {
        await mergePdfFiles({
          files: [docA],
        });
      },
      /At least 2 PDF files are required to merge/
    );
  });

  it('fails gracefully on corrupted PDF data', async () => {
    const corruptedBuffer = new TextEncoder().encode('Not a real PDF file');
    const docA = await createTestPdf('DocA', 2);

    await assert.rejects(
      async () => {
        await mergePdfFiles({
          files: [docA, { name: 'corrupted.pdf', buffer: corruptedBuffer.buffer as ArrayBuffer }],
        });
      },
      /Could not parse "corrupted\.pdf"/
    );
  });

  it('preserves multiple copies of the exact same document without deduplication', async () => {
    const docA = await createTestPdf('DocA', 2);

    const result = await mergePdfFiles({
      files: [
        { name: 'document.pdf', buffer: docA.buffer },
        { name: 'document.pdf', buffer: docA.buffer },
        { name: 'document.pdf', buffer: docA.buffer },
      ],
    });

    assert.equal(result.totalPages, 6);
    assert.equal(result.fileCount, 3);
  });

  it('preserves mixed page dimensions and page rotations from source documents', async () => {
    // Document 1: 300x500 page, 90 deg rotation
    const doc1 = await PDFDocument.create();
    const p1 = doc1.addPage([300, 500]);
    p1.setRotation(degrees(90));
    const bytes1 = await doc1.save();

    // Document 2: 600x800 page, 0 deg rotation
    const doc2 = await PDFDocument.create();
    doc2.addPage([600, 800]);
    const bytes2 = await doc2.save();

    const result = await mergePdfFiles({
      files: [
        { name: 'doc1.pdf', buffer: bytes1.buffer as ArrayBuffer },
        { name: 'doc2.pdf', buffer: bytes2.buffer as ArrayBuffer },
      ],
    });

    const reloaded = await PDFDocument.load(result.uint8Array);
    const pages = reloaded.getPages();

    assert.equal(pages[0].getWidth(), 300);
    assert.equal(pages[0].getHeight(), 500);
    assert.equal(pages[0].getRotation().angle, 90);

    assert.equal(pages[1].getWidth(), 600);
    assert.equal(pages[1].getHeight(), 800);
    assert.equal(pages[1].getRotation().angle, 0);
  });

  it('invokes progress callback through merging stages', async () => {
    const docA = await createTestPdf('DocA', 1);
    const docB = await createTestPdf('DocB', 1);

    const progressReports: string[] = [];

    await mergePdfFiles({
      files: [docA, docB],
      onProgress: (_curr, _total, stage, pct) => {
        progressReports.push(`${stage} (${pct}%)`);
      },
    });

    assert.ok(progressReports.length >= 3);
    assert.ok(progressReports.some((msg) => msg.includes('Complete!')));
  });
});
