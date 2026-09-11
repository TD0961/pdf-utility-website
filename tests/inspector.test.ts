import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { inspectPdfDocument } from '../src/lib/pdf/inspector';

describe('Document Inspection & Diagnostics Engine', () => {
  it('inspects a standard document and detects geometry and selectable text', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([600, 800]);
    page.drawText('This is a test document with plenty of selectable text for inspection.', {
      x: 50,
      y: 750,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await doc.save();
    const expectedBytes = pdfBytes.byteLength;
    const diagnostics = await inspectPdfDocument(pdfBytes.buffer as ArrayBuffer);

    assert.equal(diagnostics.pageCount, 1);
    assert.equal(diagnostics.fileSizeBytes, expectedBytes);
    assert.equal(diagnostics.hasMixedPageSizes, false);
    assert.equal(diagnostics.dimensions[0].width, 600);
    assert.equal(diagnostics.dimensions[0].height, 800);
    assert.equal(diagnostics.dimensions[0].orientation, 'portrait');
    assert.equal(diagnostics.hasSelectableText, true);
    assert.equal(diagnostics.isLikelyScanned, false);
    assert.equal(diagnostics.hasAcroForm, false);
  });

  it('detects interactive AcroForm fields and produces form recommendation', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([600, 800]);
    const form = doc.getForm();
    const field = form.createTextField('user_name');
    field.setText('Antigravity Engineer');

    const pdfBytes = await doc.save();
    const diagnostics = await inspectPdfDocument(pdfBytes.buffer as ArrayBuffer);

    assert.equal(diagnostics.hasAcroForm, true);
    assert.equal(diagnostics.acroFormFieldCount, 1);
    const formWarn = diagnostics.warnings.find((w) => w.id === 'form-fields');
    assert.ok(formWarn, 'Should emit form fields advisory warning');
    assert.equal(formWarn?.recommendedTool?.slug, 'flatten-pdf');
  });

  it('detects mixed page sizes and recommends resize-pdf', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([595, 842]); // A4
    doc.addPage([612, 792]); // Letter

    const pdfBytes = await doc.save();
    const diagnostics = await inspectPdfDocument(pdfBytes.buffer as ArrayBuffer);

    assert.equal(diagnostics.pageCount, 2);
    assert.equal(diagnostics.hasMixedPageSizes, true);
    const mixedWarn = diagnostics.warnings.find((w) => w.id === 'mixed-sizes');
    assert.ok(mixedWarn, 'Should emit mixed page sizes advisory');
    assert.equal(mixedWarn?.recommendedTool?.slug, 'resize-pdf');
  });

  it('detects scanned / image-only documents without text and recommends ocr-pdf', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([600, 800]); // Blank page, zero text items

    const pdfBytes = await doc.save();
    const diagnostics = await inspectPdfDocument(pdfBytes.buffer as ArrayBuffer);

    assert.equal(diagnostics.hasSelectableText, false);
    assert.equal(diagnostics.isLikelyScanned, true);
    const scannedWarn = diagnostics.warnings.find((w) => w.id === 'scanned-doc');
    assert.ok(scannedWarn, 'Should emit scanned document advisory');
    assert.equal(scannedWarn?.recommendedTool?.slug, 'ocr-pdf');
  });
});
