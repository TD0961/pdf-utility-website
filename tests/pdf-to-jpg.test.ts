import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { convertPdfToJpg } from '@/lib/pdf/pdf-to-jpg';
import { createTestPdf, createTestJpgBytes } from './test-helpers';
import { validateJpgOutput, assertValidZipContainsJpgs } from '@/lib/pdf/output-validator';

describe('PDF to JPG Engine', () => {
  it('converts a 1-page PDF directly to a single JPG file without ZIP overhead', async () => {
    const pdfFile = await createTestPdf('single-doc', 1);

    const result = await convertPdfToJpg({
      file: pdfFile,
      pages: 'all',
      quality: 'high',
      renderPageOverride: async () => {
        return createTestJpgBytes(800, 600);
      },
    });

    assert.strictEqual(result.isZip, false);
    assert.strictEqual(result.pageCount, 1);
    assert.strictEqual(result.fileName, 'single-doc-page-001.jpg');
    assert.strictEqual(result.outputFiles.length, 1);

    const jpgCheck = validateJpgOutput(result.outputFiles[0].bytes);
    assert.strictEqual(jpgCheck.valid, true);
    assert.ok(jpgCheck.byteLength > 0);
  });

  it('converts a multi-page PDF into a ZIP archive of individual zero-padded JPEG files', async () => {
    const pdfFile = await createTestPdf('multi-doc', 3);

    const result = await convertPdfToJpg({
      file: pdfFile,
      pages: 'all',
      quality: 'high',
      renderPageOverride: async () => {
        return createTestJpgBytes(600, 800);
      },
    });

    assert.strictEqual(result.isZip, true);
    assert.strictEqual(result.pageCount, 3);
    assert.strictEqual(result.fileName, 'multi-doc-pages.zip');
    assert.strictEqual(result.outputFiles.length, 3);

    // Verify zero-padded naming convention
    assert.strictEqual(result.outputFiles[0].name, 'multi-doc-page-001.jpg');
    assert.strictEqual(result.outputFiles[1].name, 'multi-doc-page-002.jpg');
    assert.strictEqual(result.outputFiles[2].name, 'multi-doc-page-003.jpg');

    // Verify ZIP archive integrity
    const zipArrayBuffer = await result.blob.arrayBuffer();
    const zipReport = await assertValidZipContainsJpgs(zipArrayBuffer, 3);
    assert.strictEqual(zipReport.valid, true);
    assert.strictEqual(zipReport.fileCount, 3);
  });

  it('correctly processes page ranges (e.g. "1-2" from a 5-page PDF)', async () => {
    const pdfFile = await createTestPdf('five-page-doc', 5);

    const pagesRendered: number[] = [];
    const result = await convertPdfToJpg({
      file: pdfFile,
      pages: '1-2',
      renderPageOverride: async (pageNum) => {
        pagesRendered.push(pageNum);
        return createTestJpgBytes(400, 400);
      },
    });

    assert.strictEqual(result.pageCount, 2);
    assert.deepStrictEqual(pagesRendered, [1, 2]);
    assert.strictEqual(result.outputFiles[0].pageNumber, 1);
    assert.strictEqual(result.outputFiles[1].pageNumber, 2);
  });

  it('correctly processes non-consecutive page range (e.g. "1, 3" extracting selected pages)', async () => {
    const pdfFile = await createTestPdf('ordered-doc', 4);

    const pagesRendered: number[] = [];
    const result = await convertPdfToJpg({
      file: pdfFile,
      pages: '1, 3',
      renderPageOverride: async (pageNum) => {
        pagesRendered.push(pageNum);
        return createTestJpgBytes(400, 400);
      },
    });

    assert.strictEqual(result.pageCount, 2);
    assert.deepStrictEqual(pagesRendered, [1, 3]);
    assert.strictEqual(result.outputFiles[0].pageNumber, 1);
    assert.strictEqual(result.outputFiles[1].pageNumber, 3);
  });

  it('rejects out-of-bounds page range expressions', async () => {
    const pdfFile = await createTestPdf('short-doc', 2);

    await assert.rejects(
      async () => {
        await convertPdfToJpg({
          file: pdfFile,
          pages: '1-5', // Document only has 2 pages
          renderPageOverride: async () => createTestJpgBytes(100, 100),
        });
      },
      /does not exist|only has 2 pages/i
    );
  });

  it('passes correct scale factors for standard (1.5x), high (2.0x), and very-high (3.0x) presets', async () => {
    const pdfFile = await createTestPdf('scale-doc', 1);

    const recordedScales: number[] = [];

    // Standard
    await convertPdfToJpg({
      file: pdfFile,
      quality: 'standard',
      renderPageOverride: async (_pageNum, scale) => {
        recordedScales.push(scale);
        return createTestJpgBytes(100, 100);
      },
    });

    // High
    await convertPdfToJpg({
      file: pdfFile,
      quality: 'high',
      renderPageOverride: async (_pageNum, scale) => {
        recordedScales.push(scale);
        return createTestJpgBytes(100, 100);
      },
    });

    // Very High
    await convertPdfToJpg({
      file: pdfFile,
      quality: 'very-high',
      renderPageOverride: async (_pageNum, scale) => {
        recordedScales.push(scale);
        return createTestJpgBytes(100, 100);
      },
    });

    assert.deepStrictEqual(recordedScales, [1.5, 2.0, 3.0]);
  });

  it('validates each output JPEG bytes with validateJpgOutput', async () => {
    const pdfFile = await createTestPdf('val-doc', 2);

    const result = await convertPdfToJpg({
      file: pdfFile,
      renderPageOverride: async () => createTestJpgBytes(500, 500),
    });

    for (const outputFile of result.outputFiles) {
      const validation = validateJpgOutput(outputFile.bytes);
      assert.strictEqual(validation.valid, true);
      assert.ok(validation.byteLength > 0);
    }
  });

  it('rejects non-PDF corrupted files', async () => {
    const corrupted = {
      name: 'corrupted.pdf',
      buffer: new TextEncoder().encode('Not a valid PDF file').buffer as ArrayBuffer,
    };

    await assert.rejects(
      async () => {
        await convertPdfToJpg({
          file: corrupted,
          renderPageOverride: async () => createTestJpgBytes(100, 100),
        });
      },
      /valid PDF/i
    );
  });

  it('emits sequential progress updates across all pages (0% to 100%)', async () => {
    const pdfFile = await createTestPdf('progress-doc', 3);

    const progressReports: Array<{ percent: number; stage: string }> = [];

    await convertPdfToJpg({
      file: pdfFile,
      onProgress: (_curr, _total, stage, percent) => {
        progressReports.push({ percent, stage });
      },
      renderPageOverride: async () => createTestJpgBytes(100, 100),
    });

    assert.ok(progressReports.length >= 3, 'Must emit progress for each page');
    const finalReport = progressReports[progressReports.length - 1];
    assert.strictEqual(finalReport.percent, 100);
    assert.match(finalReport.stage, /Complete/i);
  });

  it('respects custom outputFileName', async () => {
    const pdfFile = await createTestPdf('custom-name', 2);

    const result = await convertPdfToJpg({
      file: pdfFile,
      outputFileName: 'my-custom-archive.zip',
      renderPageOverride: async () => createTestJpgBytes(100, 100),
    });

    assert.strictEqual(result.fileName, 'my-custom-archive.zip');
  });
});
