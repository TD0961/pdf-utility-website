import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { convertJpgToPdf, PAGE_SIZES } from '@/lib/pdf/jpg-to-pdf';
import { createTestJpgFile } from './test-helpers';
import { validatePdfOutput } from '@/lib/pdf/output-validator';
import { PDFDocument } from 'pdf-lib';

describe('JPG to PDF Engine', () => {
  it('converts a single JPEG image into a valid 1-page PDF document', async () => {
    const imgFile = createTestJpgFile('photo.jpg', 400, 300);
    const result = await convertJpgToPdf({
      images: [imgFile],
      outputFileName: 'photo.pdf',
      pageSize: 'auto',
      orientation: 'auto',
      margin: 'none',
      fit: 'fit',
    });

    assert.strictEqual(result.totalPages, 1);
    assert.strictEqual(result.fileName, 'photo.pdf');
    assert.ok(result.uint8Array.byteLength > 0);

    const validation = await validatePdfOutput(result.uint8Array, { expectedPages: 1 });
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.dimensions[0].width, 400);
    assert.strictEqual(validation.dimensions[0].height, 300);
  });

  it('converts multiple JPEG images preserving exact sequential order', async () => {
    const img1 = createTestJpgFile('first.jpg', 200, 200);
    const img2 = createTestJpgFile('second.jpg', 300, 300);
    const img3 = createTestJpgFile('third.jpg', 400, 400);

    const result = await convertJpgToPdf({
      images: [img1, img2, img3],
      outputFileName: 'first-and-more.pdf',
      pageSize: 'auto',
      orientation: 'auto',
      margin: 'none',
      fit: 'fit',
    });

    assert.strictEqual(result.totalPages, 3);
    assert.strictEqual(result.fileName, 'first-and-more.pdf');

    const validation = await validatePdfOutput(result.uint8Array, { expectedPages: 3 });
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.dimensions[0].width, 200);
    assert.strictEqual(validation.dimensions[1].width, 300);
    assert.strictEqual(validation.dimensions[2].width, 400);
  });

  it('preserves duplicate images without deduplicating or dropping pages', async () => {
    const img = createTestJpgFile('dup.jpg', 150, 150);
    const result = await convertJpgToPdf({
      images: [img, img, img],
      pageSize: 'auto',
      orientation: 'auto',
      margin: 'none',
      fit: 'fit',
    });

    assert.strictEqual(result.totalPages, 3);
    const validation = await validatePdfOutput(result.uint8Array, { expectedPages: 3 });
    assert.strictEqual(validation.valid, true);
  });

  it('Page Size: standard presets (A4, Letter, Legal) create correctly dimensioned pages', async () => {
    const img = createTestJpgFile('test.jpg', 200, 200);

    // A4
    const a4Result = await convertJpgToPdf({
      images: [img],
      pageSize: 'a4',
      orientation: 'portrait',
      margin: 'none',
      fit: 'fit',
    });
    const a4Doc = await PDFDocument.load(a4Result.uint8Array);
    const a4Page = a4Doc.getPage(0);
    assert.strictEqual(Math.round(a4Page.getWidth()), Math.round(PAGE_SIZES.a4[0]));
    assert.strictEqual(Math.round(a4Page.getHeight()), Math.round(PAGE_SIZES.a4[1]));

    // US Letter
    const letterResult = await convertJpgToPdf({
      images: [img],
      pageSize: 'letter',
      orientation: 'portrait',
      margin: 'none',
      fit: 'fit',
    });
    const letterDoc = await PDFDocument.load(letterResult.uint8Array);
    const letterPage = letterDoc.getPage(0);
    assert.strictEqual(Math.round(letterPage.getWidth()), Math.round(PAGE_SIZES.letter[0]));
    assert.strictEqual(Math.round(letterPage.getHeight()), Math.round(PAGE_SIZES.letter[1]));

    // US Legal
    const legalResult = await convertJpgToPdf({
      images: [img],
      pageSize: 'legal',
      orientation: 'portrait',
      margin: 'none',
      fit: 'fit',
    });
    const legalDoc = await PDFDocument.load(legalResult.uint8Array);
    const legalPage = legalDoc.getPage(0);
    assert.strictEqual(Math.round(legalPage.getWidth()), Math.round(PAGE_SIZES.legal[0]));
    assert.strictEqual(Math.round(legalPage.getHeight()), Math.round(PAGE_SIZES.legal[1]));
  });

  it('Orientation: Auto selects landscape for wide images and portrait for tall images', async () => {
    const wideImg = createTestJpgFile('wide.jpg', 800, 400);
    const tallImg = createTestJpgFile('tall.jpg', 400, 800);

    const result = await convertJpgToPdf({
      images: [wideImg, tallImg],
      pageSize: 'a4',
      orientation: 'auto',
      margin: 'none',
      fit: 'fit',
    });

    const doc = await PDFDocument.load(result.uint8Array);
    const p1 = doc.getPage(0);
    const p2 = doc.getPage(1);

    // Page 1 should be landscape (width > height)
    assert.ok(p1.getWidth() > p1.getHeight(), 'Wide image should yield landscape page in auto orientation');
    // Page 2 should be portrait (height > width)
    assert.ok(p2.getHeight() > p2.getWidth(), 'Tall image should yield portrait page in auto orientation');
  });

  it('Orientation: explicit Portrait and Landscape settings force desired dimensions', async () => {
    const img = createTestJpgFile('img.jpg', 500, 200);

    // Forced portrait
    const portraitRes = await convertJpgToPdf({
      images: [img],
      pageSize: 'a4',
      orientation: 'portrait',
      margin: 'none',
      fit: 'fit',
    });
    const pDoc = await PDFDocument.load(portraitRes.uint8Array);
    const pPage = pDoc.getPage(0);
    assert.ok(pPage.getHeight() > pPage.getWidth(), 'Explicit portrait must have height > width');

    // Forced landscape
    const landscapeRes = await convertJpgToPdf({
      images: [img],
      pageSize: 'a4',
      orientation: 'landscape',
      margin: 'none',
      fit: 'fit',
    });
    const lDoc = await PDFDocument.load(landscapeRes.uint8Array);
    const lPage = lDoc.getPage(0);
    assert.ok(lPage.getWidth() > lPage.getHeight(), 'Explicit landscape must have width > height');
  });

  it('Margins: none (0), small (18), medium (36) are supported without errors', async () => {
    const img = createTestJpgFile('img.jpg', 300, 300);

    for (const margin of ['none', 'small', 'medium'] as const) {
      const res = await convertJpgToPdf({
        images: [img],
        pageSize: 'a4',
        orientation: 'portrait',
        margin,
        fit: 'fit',
      });
      assert.strictEqual(res.totalPages, 1);
      const validation = await validatePdfOutput(res.uint8Array, { expectedPages: 1 });
      assert.strictEqual(validation.valid, true);
    }
  });

  it('Image Fit: handles fit and fill modes successfully', async () => {
    const img = createTestJpgFile('img.jpg', 300, 150);

    // Fit mode
    const fitRes = await convertJpgToPdf({
      images: [img],
      pageSize: 'a4',
      orientation: 'portrait',
      margin: 'small',
      fit: 'fit',
    });
    const fitValidation = await validatePdfOutput(fitRes.uint8Array, { expectedPages: 1 });
    assert.strictEqual(fitValidation.valid, true);

    // Fill mode
    const fillRes = await convertJpgToPdf({
      images: [img],
      pageSize: 'a4',
      orientation: 'portrait',
      margin: 'small',
      fit: 'fill',
    });
    const fillValidation = await validatePdfOutput(fillRes.uint8Array, { expectedPages: 1 });
    assert.strictEqual(fillValidation.valid, true);
  });

  it('rejects zero images with clear error message', async () => {
    await assert.rejects(
      async () => {
        await convertJpgToPdf({
          images: [],
        });
      },
      /Please select at least one image file/
    );
  });

  it('rejects non-JPEG or corrupted image bytes with clear validation error', async () => {
    const corruptFile = {
      name: 'fake.jpg',
      buffer: new TextEncoder().encode('This is not a JPEG file at all').buffer as ArrayBuffer,
    };

    await assert.rejects(
      async () => {
        await convertJpgToPdf({
          images: [corruptFile],
        });
      },
      /valid JPEG/i
    );
  });

  it('invokes progress callback through conversion stages (0% to 100%)', async () => {
    const img1 = createTestJpgFile('1.jpg', 100, 100);
    const img2 = createTestJpgFile('2.jpg', 100, 100);

    const progressReports: Array<{ percent: number; message: string }> = [];

    await convertJpgToPdf({
      images: [img1, img2],
      onProgress: (_processed, _total, message, percent) => {
        progressReports.push({ percent, message });
      },
    });

    assert.ok(progressReports.length >= 2, 'Should emit multiple progress steps');
    const finalReport = progressReports[progressReports.length - 1];
    assert.strictEqual(finalReport.percent, 100);
    assert.match(finalReport.message, /Complete/i);
  });
});
