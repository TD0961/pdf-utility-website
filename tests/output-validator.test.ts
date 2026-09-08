import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePdfOutput, validateZipOutput, assertValidPdfOutput, assertValidZipOutput } from '@/lib/pdf/output-validator';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

describe('Output Validation Engine', () => {
  it('validates a well-formed PDF document successfully', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);
    doc.addPage([500, 700]);
    const bytes = await doc.save();

    const report = await validatePdfOutput(bytes, { expectedPages: 2 });
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.pageCount, 2);
    assert.strictEqual(report.dimensions.length, 2);
    assert.strictEqual(report.dimensions[0].width, 400);
    assert.strictEqual(report.dimensions[0].height, 600);
    assert.strictEqual(report.dimensions[1].width, 500);
    assert.strictEqual(report.dimensions[1].height, 700);
  });

  it('rejects empty byte arrays', async () => {
    const emptyBytes = new Uint8Array(0);
    const report = await validatePdfOutput(emptyBytes);
    assert.strictEqual(report.valid, false);
    assert.match(report.error || '', /empty/i);
  });

  it('rejects data missing %PDF- magic header', async () => {
    const fakeBytes = new TextEncoder().encode('Hello World this is not a PDF file at all!');
    const report = await validatePdfOutput(fakeBytes);
    assert.strictEqual(report.valid, false);
    assert.match(report.error || '', /%PDF-/i);
  });

  it('detects page count mismatches', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 400]);
    const bytes = await doc.save();

    const report = await validatePdfOutput(bytes, { expectedPages: 3 });
    assert.strictEqual(report.valid, false);
    assert.match(report.error || '', /Page count mismatch/i);
  });

  it('assertValidPdfOutput throws Error when validation fails', async () => {
    const badBytes = new TextEncoder().encode('Corrupted binary data');
    await assert.rejects(
      async () => {
        await assertValidPdfOutput(badBytes);
      },
      /Output PDF verification failed/
    );
  });

  it('validates a valid ZIP containing valid PDF files', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 400]);
    const pdfBytes = await doc.save();

    const zip = new JSZip();
    zip.file('page-1.pdf', pdfBytes);
    zip.file('page-2.pdf', pdfBytes);

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const report = await validateZipOutput(zipBuffer, 2);

    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.fileCount, 2);
    assert.deepStrictEqual(report.fileNames.sort(), ['page-1.pdf', 'page-2.pdf'].sort());
  });

  it('rejects a ZIP with entry count mismatch', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 400]);
    const pdfBytes = await doc.save();

    const zip = new JSZip();
    zip.file('page-1.pdf', pdfBytes);

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const report = await validateZipOutput(zipBuffer, 3);

    assert.strictEqual(report.valid, false);
    assert.match(report.error || '', /ZIP entry count mismatch/i);
  });

  it('rejects a ZIP containing corrupted PDF entries', async () => {
    const zip = new JSZip();
    zip.file('corrupt.pdf', new TextEncoder().encode('This is not a real PDF document'));

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const report = await validateZipOutput(zipBuffer, 1);

    assert.strictEqual(report.valid, false);
    assert.match(report.error || '', /corrupt\.pdf.*invalid/i);
  });

  it('assertValidZipOutput asserts valid ZIP or throws', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 400]);
    const pdfBytes = await doc.save();

    const zip = new JSZip();
    zip.file('page-1.pdf', pdfBytes);
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    const report = await assertValidZipOutput(zipBuffer, 1);
    assert.strictEqual(report.valid, true);

    await assert.rejects(
      async () => {
        await assertValidZipOutput(zipBuffer, 5);
      },
      /Output ZIP verification failed/
    );
  });
});
