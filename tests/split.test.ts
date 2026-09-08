import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { splitPdfDocument, SplitMode } from '../src/lib/pdf/split';
import { createTestPdf } from './test-helpers';

describe('Split PDF Engine', () => {
  it('Mode A: extracts selected pages into a single PDF', async () => {
    const doc = await createTestPdf('TestDoc', 5);

    // Extract pages 1 and 4 (0-based indices 0 and 3)
    const result = await splitPdfDocument({
      file: doc,
      mode: 'extract',
      selectedPages: [0, 3],
    });

    assert.equal(result.isZip, false);
    assert.equal(result.fileCount, 1);
    assert.match(result.fileName, /\.pdf$/);

    const parsed = await PDFDocument.load(await result.blob.arrayBuffer());
    assert.equal(parsed.getPageCount(), 2);
  });

  it('Mode A: preserves exact user-selected order when extracting (e.g. 5, 3, 1)', async () => {
    const doc = await createTestPdf('TestDoc', 5);

    // User requested index 4, then 2, then 0 (reverse order)
    const result = await splitPdfDocument({
      file: doc,
      mode: 'extract',
      selectedPages: [4, 2, 0],
    });

    assert.equal(result.isZip, false);
    assert.equal(result.fileCount, 1);

    const parsed = await PDFDocument.load(await result.blob.arrayBuffer());
    assert.equal(parsed.getPageCount(), 3);
  });

  it('Mode A: rejects empty page selection', async () => {
    const doc = await createTestPdf('TestDoc', 5);

    await assert.rejects(
      async () => {
        await splitPdfDocument({
          file: doc,
          mode: 'extract',
          selectedPages: [],
        });
      },
      /Please select at least one page to extract/
    );
  });

  it('Mode B: splits an 5-page PDF into 5 individual files packaged into a ZIP', async () => {
    const doc = await createTestPdf('TestDoc', 5);

    const result = await splitPdfDocument({
      file: doc,
      mode: 'every-page',
    });

    assert.equal(result.isZip, true);
    assert.equal(result.fileCount, 5);
    assert.match(result.fileName, /\.zip$/);

    // Read the ZIP archive to verify contents
    const zipData = await JSZip.loadAsync(await result.blob.arrayBuffer());
    const fileNames = Object.keys(zipData.files);

    assert.equal(fileNames.length, 5);
    assert(fileNames.includes('TestDoc-page-1.pdf'));
    assert(fileNames.includes('TestDoc-page-5.pdf'));

    // Verify one of the files in the zip is a valid 1-page PDF
    const page1Bytes = await zipData.file('TestDoc-page-1.pdf')?.async('uint8array');
    assert(page1Bytes);
    const parsedPage1 = await PDFDocument.load(page1Bytes);
    assert.equal(parsedPage1.getPageCount(), 1);
  });

  it('Mode C: splits by multiple ranges (e.g. "1-2, 4-5") into a ZIP of PDFs', async () => {
    const doc = await createTestPdf('TestDoc', 5);

    const result = await splitPdfDocument({
      file: doc,
      mode: 'ranges',
      rangeExpression: '1-2, 4-5',
    });

    assert.equal(result.isZip, true);
    assert.equal(result.fileCount, 2);

    const zipData = await JSZip.loadAsync(await result.blob.arrayBuffer());
    const fileNames = Object.keys(zipData.files);

    assert.equal(fileNames.length, 2);
    assert(fileNames.includes('TestDoc-pages-1-2.pdf'));
    assert(fileNames.includes('TestDoc-pages-4-5.pdf'));
  });

  it('Mode C: downloads directly as PDF if only one range is specified', async () => {
    const doc = await createTestPdf('TestDoc', 10);

    const result = await splitPdfDocument({
      file: doc,
      mode: 'ranges',
      rangeExpression: '2-4',
    });

    assert.equal(result.isZip, false);
    assert.equal(result.fileCount, 1);
    assert.equal(result.fileName, 'TestDoc-pages-2-4.pdf');

    const parsed = await PDFDocument.load(await result.blob.arrayBuffer());
    assert.equal(parsed.getPageCount(), 3);
  });

  it('rejects invalid range expressions gracefully', async () => {
    const doc = await createTestPdf('TestDoc', 5);

    await assert.rejects(
      async () => {
        await splitPdfDocument({
          file: doc,
          mode: 'ranges',
          rangeExpression: '1-10', // Document only has 5 pages
        });
      },
      /Page 10 does not exist/
    );
  });

  it('rejects unsupported split mode gracefully', async () => {
    const doc = await createTestPdf('TestDoc', 2);

    await assert.rejects(
      async () => {
        await splitPdfDocument({
          file: doc,
          mode: 'invalid-mode' as unknown as SplitMode,
        });
      },
      /Unsupported split mode/
    );
  });
});
