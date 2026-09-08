import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mergePdfFiles } from '@/lib/pdf/merge';
import { organizePdfDocument } from '@/lib/pdf/organize';
import { splitPdfDocument } from '@/lib/pdf/split';
import {
  createSimpleTextFixture,
  createImageHeavyFixture,
  createMixedOrientationFixture,
  createMixedPageSizeFixture,
  createRotatedPagesFixture,
  createLargePageCountFixture,
} from './fixtures-generator';
import { PDFDocument } from 'pdf-lib';

describe('PDF Compatibility & Hardening Matrix', () => {
  it('Merges mixed page sizes, orientations, images, and rotations into a single valid PDF', async () => {
    const textFix = await createSimpleTextFixture(); // 3 pages (A4 portrait)
    const imgFix = await createImageHeavyFixture(); // 2 pages (600x600 with PNG)
    const orientFix = await createMixedOrientationFixture(); // 2 pages (1 portrait, 1 landscape)
    const sizeFix = await createMixedPageSizeFixture(); // 3 pages (A4, Letter, Legal)
    const rotFix = await createRotatedPagesFixture(); // 4 pages (0, 90, 180, 270 deg)

    const expectedTotal = 3 + 2 + 2 + 3 + 4; // 14 pages

    const result = await mergePdfFiles({
      files: [textFix, imgFix, orientFix, sizeFix, rotFix],
      outputFileName: 'comprehensive-merge.pdf',
    });

    assert.strictEqual(result.totalPages, expectedTotal);
    assert.strictEqual(result.fileCount, 5);
    assert.strictEqual(result.fileName, 'comprehensive-merge.pdf');
    assert.ok(result.fileSize > 1000);

    // Verify geometry of resulting document
    const reloaded = await PDFDocument.load(result.uint8Array);
    assert.strictEqual(reloaded.getPageCount(), expectedTotal);

    const pages = reloaded.getPages();

    // Text fixture pages (A4 portrait ~ 595.28 x 841.89)
    assert.ok(Math.abs(pages[0].getWidth() - 595.28) < 1);
    assert.ok(Math.abs(pages[0].getHeight() - 841.89) < 1);

    // Image fixture page (600 x 600)
    assert.strictEqual(pages[3].getWidth(), 600);
    assert.strictEqual(pages[3].getHeight(), 600);

    // Mixed orientation: Page 6 portrait (595x842), Page 7 landscape (842x595)
    assert.ok(pages[5].getHeight() > pages[5].getWidth()); // Portrait
    assert.ok(pages[6].getWidth() > pages[6].getHeight()); // Landscape

    // Mixed sizes: Page 8 (A4), Page 9 (Letter: 612x792), Page 10 (Legal: 612x1008)
    assert.ok(Math.abs(pages[8].getWidth() - 612) < 1);
    assert.ok(Math.abs(pages[9].getHeight() - 1008) < 1);

    // Rotated pages preservation: 0, 90, 180, 270 deg
    assert.strictEqual(pages[10].getRotation().angle, 0);
    assert.strictEqual(pages[11].getRotation().angle, 90);
    assert.strictEqual(pages[12].getRotation().angle, 180);
    assert.strictEqual(pages[13].getRotation().angle, 270);
  });

  it('Organize: accurately computes cumulative rotation with pre-existing /Rotate metadata', async () => {
    const rotFix = await createRotatedPagesFixture(); // 4 pages: P0=0°, P1=90°, P2=180°, P3=270°

    // Test operations:
    // P1 (initial 90°) + 90° user rotation -> 180°
    // P2 (initial 180°) + 180° user rotation -> 360° (0°)
    // P3 (initial 270°) + 90° user rotation -> 360° (0°)
    // P0 (initial 0°) + 270° user rotation -> 270°
    const result = await organizePdfDocument({
      file: rotFix,
      pages: [
        { id: '1', originalIndex: 1, rotation: 90 },
        { id: '2', originalIndex: 2, rotation: 180 },
        { id: '3', originalIndex: 3, rotation: 90 },
        { id: '0', originalIndex: 0, rotation: 270 },
      ],
      outputFileName: 'rotated-organized.pdf',
    });

    assert.strictEqual(result.totalPages, 4);

    const reloaded = await PDFDocument.load(result.uint8Array);
    const pages = reloaded.getPages();

    assert.strictEqual(pages[0].getRotation().angle, 180); // 90 + 90
    assert.strictEqual(pages[1].getRotation().angle, 0);   // 180 + 180 = 360 => 0
    assert.strictEqual(pages[2].getRotation().angle, 0);   // 270 + 90 = 360 => 0
    assert.strictEqual(pages[3].getRotation().angle, 270); // 0 + 270 = 270
  });

  it('Organize: multi-step sequence (duplicate, rotate, reorder, delete)', async () => {
    const textFix = await createSimpleTextFixture(); // 3 pages (0, 1, 2)

    // Desired output sequence:
    // Page 2 duplicated twice (one rotated 90°, one 180°)
    // Page 0 rotated 0°
    // (Page 1 deleted)
    const result = await organizePdfDocument({
      file: textFix,
      pages: [
        { id: 'a', originalIndex: 2, rotation: 90 },
        { id: 'b', originalIndex: 2, rotation: 180 },
        { id: 'c', originalIndex: 0, rotation: 0 },
      ],
    });

    assert.strictEqual(result.totalPages, 3);
    const reloaded = await PDFDocument.load(result.uint8Array);
    const pages = reloaded.getPages();

    assert.strictEqual(pages[0].getRotation().angle, 90);
    assert.strictEqual(pages[1].getRotation().angle, 180);
    assert.strictEqual(pages[2].getRotation().angle, 0);
  });

  it('Split: splits 100-page PDF into range groups packaged in verified ZIP', async () => {
    const largeFix = await createLargePageCountFixture(100);

    const result = await splitPdfDocument({
      file: largeFix,
      mode: 'ranges',
      rangeExpression: '1-10, 25-30, 95-100',
    });

    assert.strictEqual(result.isZip, true);
    assert.strictEqual(result.fileCount, 3);
    assert.strictEqual(result.outputFiles.length, 3);
    assert.strictEqual(result.outputFiles[0].pageCount, 10);
    assert.strictEqual(result.outputFiles[1].pageCount, 6);
    assert.strictEqual(result.outputFiles[2].pageCount, 6);
  });

  it('Split: preserves exact user-selected order in Extract mode (e.g. 5, 3, 1)', async () => {
    const textFix = await createSimpleTextFixture(); // 3 pages (indices 0, 1, 2)

    // User explicitly requests index 2, then index 0 (reverse order)
    const result = await splitPdfDocument({
      file: textFix,
      mode: 'extract',
      selectedPages: [2, 0],
    });

    assert.strictEqual(result.fileCount, 1);
    assert.strictEqual(result.isZip, false);

    const reloaded = await PDFDocument.load(result.outputFiles[0].bytes);
    assert.strictEqual(reloaded.getPageCount(), 2);
  });

  it('Split: handles overlapping ranges deterministically without unexpected page loss', async () => {
    const textFix = await createSimpleTextFixture(); // 3 pages (1, 2, 3)

    // Overlapping ranges: 1-2 and 2-3
    const result = await splitPdfDocument({
      file: textFix,
      mode: 'ranges',
      rangeExpression: '1-2, 2-3',
    });

    assert.strictEqual(result.fileCount, 2);
    assert.strictEqual(result.outputFiles[0].pageCount, 2); // pages 1 and 2
    assert.strictEqual(result.outputFiles[1].pageCount, 2); // pages 2 and 3
  });

  it('Merge: preserves duplicate files with identical filenames and contents', async () => {
    const textFix = await createSimpleTextFixture(); // 3 pages

    // User selects document.pdf 3 times
    const fileA = { name: 'document.pdf', buffer: textFix.buffer, id: 'id-1' };
    const fileB = { name: 'document.pdf', buffer: textFix.buffer, id: 'id-2' };
    const fileC = { name: 'document.pdf', buffer: textFix.buffer, id: 'id-3' };

    const result = await mergePdfFiles({
      files: [fileA, fileB, fileC],
      outputFileName: 'merged-duplicates.pdf',
    });

    assert.strictEqual(result.fileCount, 3);
    assert.strictEqual(result.totalPages, 9); // 3 * 3 = 9 pages
  });
});
