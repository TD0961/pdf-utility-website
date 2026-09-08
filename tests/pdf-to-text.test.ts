import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromPdfDocument } from '@/lib/pdf/pdf-to-text';
import { createTestPdf } from './test-helpers';
import { PDFDocument, StandardFonts } from 'pdf-lib';

describe('PDF to Text Engine', () => {
  it('extracts text from a single-page PDF document', async () => {
    const pdfFile = await createTestPdf('single-doc', 1);

    const result = await extractTextFromPdfDocument({
      file: pdfFile,
    });

    assert.strictEqual(result.totalPages, 1);
    assert.strictEqual(result.pages.length, 1);
    assert.match(result.fullText, /single-doc - Page 1/);
    assert.strictEqual(result.fileName, 'single-doc-extracted-text.txt');
    assert.strictEqual(result.isScanned, false);
    assert.ok(result.totalWords > 0);
    assert.ok(result.totalCharacters > 0);
  });

  it('extracts text from multi-page PDF documents and inserts "--- Page N ---" separators', async () => {
    const pdfFile = await createTestPdf('multi-doc', 3);

    const result = await extractTextFromPdfDocument({
      file: pdfFile,
    });

    assert.strictEqual(result.totalPages, 3);
    assert.strictEqual(result.pages.length, 3);

    // Verify page header separators
    assert.match(result.fullText, /--- Page 1 ---/);
    assert.match(result.fullText, /--- Page 2 ---/);
    assert.match(result.fullText, /--- Page 3 ---/);

    // Verify content from each page
    assert.match(result.pages[0].text, /multi-doc - Page 1/);
    assert.match(result.pages[1].text, /multi-doc - Page 2/);
    assert.match(result.pages[2].text, /multi-doc - Page 3/);
  });

  it('reconstructs lines and paragraphs in correct vertical order', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([500, 500]);

    // Draw lines in reverse vertical order (bottom first, then top)
    page.drawText('Line 3 at the bottom of the page', { x: 50, y: 100, size: 12, font });
    page.drawText('Line 1 at the top of the page', { x: 50, y: 400, size: 12, font });
    page.drawText('Line 2 in the middle of the page', { x: 50, y: 250, size: 12, font });

    const bytes = await doc.save();
    const result = await extractTextFromPdfDocument({
      file: { name: 'ordered-lines.pdf', buffer: bytes.buffer as ArrayBuffer },
    });

    const pageText = result.pages[0].text;
    const line1Index = pageText.indexOf('Line 1');
    const line2Index = pageText.indexOf('Line 2');
    const line3Index = pageText.indexOf('Line 3');

    assert.ok(line1Index !== -1 && line2Index !== -1 && line3Index !== -1);
    assert.ok(line1Index < line2Index, 'Line 1 (top) must appear before Line 2 (middle)');
    assert.ok(line2Index < line3Index, 'Line 2 (middle) must appear before Line 3 (bottom)');
  });

  it('accurately computes totalCharacters, totalWords, and per-page metrics', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    // Page 1: 5 words
    const p1 = doc.addPage([400, 400]);
    p1.drawText('One two three four five', { x: 50, y: 350, size: 14, font });

    // Page 2: 3 words
    const p2 = doc.addPage([400, 400]);
    p2.drawText('Six seven eight', { x: 50, y: 350, size: 14, font });

    const bytes = await doc.save();
    const result = await extractTextFromPdfDocument({
      file: { name: 'word-count.pdf', buffer: bytes.buffer as ArrayBuffer },
    });

    assert.strictEqual(result.totalPages, 2);
    assert.strictEqual(result.pages[0].wordCount, 5);
    assert.strictEqual(result.pages[1].wordCount, 3);
    assert.strictEqual(result.totalWords, 8);
    assert.ok(result.totalCharacters > 0);
  });

  it('preserves Unicode and international characters', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([500, 500]);

    // Standard ASCII and European characters
    page.drawText('Private browser tools for everyone', { x: 50, y: 400, size: 12, font });
    page.drawText('Confidentialite et securite garanties', { x: 50, y: 350, size: 12, font });

    const bytes = await doc.save();
    const result = await extractTextFromPdfDocument({
      file: { name: 'intl.pdf', buffer: bytes.buffer as ArrayBuffer },
    });

    assert.match(result.fullText, /Private browser tools for everyone/);
    assert.match(result.fullText, /Confidentialite et securite/);
  });

  it('detects scanned or image-only PDFs and flags isScanned with user guidance warning', async () => {
    const doc = await PDFDocument.create();
    // Create page with no text layer whatsoever (simulating a scanned page)
    doc.addPage([600, 800]);

    const bytes = await doc.save();
    const result = await extractTextFromPdfDocument({
      file: { name: 'scanned-contract.pdf', buffer: bytes.buffer as ArrayBuffer },
    });

    assert.strictEqual(result.isScanned, true);
    assert.ok(result.scannedWarning, 'Must provide warning message when document is scanned');
    assert.match(result.scannedWarning!, /scanned pages without selectable text/i);
  });

  it('generates a valid UTF-8 text Blob and correct .txt download filename', async () => {
    const pdfFile = await createTestPdf('export-doc', 1);

    const result = await extractTextFromPdfDocument({
      file: pdfFile,
    });

    assert.strictEqual(result.fileName, 'export-doc-extracted-text.txt');
    assert.ok(result.blob instanceof Blob);
    assert.strictEqual(result.blob.type, 'text/plain;charset=utf-8');

    const textFromBlob = await result.blob.text();
    assert.match(textFromBlob, /export-doc - Page 1/);
  });

  it('respects custom outputFileName parameter', async () => {
    const pdfFile = await createTestPdf('source-doc', 1);

    const result = await extractTextFromPdfDocument({
      file: pdfFile,
      outputFileName: 'custom-notes.txt',
    });

    assert.strictEqual(result.fileName, 'custom-notes.txt');
  });

  it('rejects non-PDF corrupted files gracefully', async () => {
    const corrupted = {
      name: 'broken.pdf',
      buffer: new TextEncoder().encode('Corrupted binary garbage').buffer as ArrayBuffer,
    };

    await assert.rejects(
      async () => {
        await extractTextFromPdfDocument({ file: corrupted });
      },
      /valid PDF/i
    );
  });

  it('emits sequential progress callbacks (0% to 100%)', async () => {
    const pdfFile = await createTestPdf('progress-doc', 2);

    const progressReports: Array<{ percent: number; stage: string }> = [];

    await extractTextFromPdfDocument({
      file: pdfFile,
      onProgress: (_curr, _total, stage, percent) => {
        progressReports.push({ percent, stage });
      },
    });

    assert.ok(progressReports.length >= 2);
    const lastReport = progressReports[progressReports.length - 1];
    assert.strictEqual(lastReport.percent, 100);
    assert.match(lastReport.stage, /Complete/i);
  });
});
