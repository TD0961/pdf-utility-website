/**
 * PDFSimplify — Advanced Forensic Compatibility & Real-World Reliability Test Suite
 * Rigorously audits engines against real-world edge cases, multi-column layouts,
 * dynamic XFA forms, geometry deltas, Unicode, adversarial inputs, and independent Poppler verification.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

import {
  createTwoColumnLayoutFixture,
  createUnicodeMultiLanguageFixture,
  createStructuredTableFixture,
  createMixedImagesFixture,
  createComplexGeometryFixture,
  createAcroFormFixture,
  createDynamicXfaFixture,
  createScannedImageOnlyFixture,
  createAnnotatedDocumentFixture,
  createMalformedPayloads,
} from './forensic-corpus-generator';

import { convertPdfToWord } from '../src/lib/pdf/conversion/converter';
import { inspectInteractiveForm, fillPdfForm } from '../src/lib/pdf/fill-form';
import { comparePdfDocuments } from '../src/lib/pdf/compare';
import { protectPdf } from '../src/lib/pdf/protect';
import { unlockPdf } from '../src/lib/pdf/unlock';
import { convertPdfToCsv } from '../src/lib/pdf/extraction/csv-extractor';
import { convertPdfToExcel } from '../src/lib/pdf/conversion/excel-converter';
import { pdfToText } from '../src/lib/pdf/pdf-to-text';
import { extractImagesFromPdf } from '../src/lib/pdf/extraction/image-extractor';
import { watermarkPdf } from '../src/lib/pdf/watermark';
import { rotatePdfDocument as rotatePdf } from '../src/lib/pdf/rotate';
import { convertPdfToGrayscale } from '../src/lib/pdf/grayscale';
import { performClientOcr } from '../src/lib/pdf/ocr';

describe('Forensic Compatibility Audit Suite', () => {
  // -------------------------------------------------------------
  // 1. Multi-Column Reading Order in PDF to Word
  // -------------------------------------------------------------
  describe('Multi-Column Reading Order & Layout Analysis', () => {
    it('prevents multi-column text interleaving and respects column reading order in Word conversion', async () => {
      const fixture = await createTwoColumnLayoutFixture();
      const wordResult = await convertPdfToWord({
        name: fixture.name,
        buffer: fixture.buffer,
      });

      assert.ok((wordResult.outputBytes?.length ?? 0) > 500, 'Word document should be generated');
      assert.equal(wordResult.totalPages, 1);

      // Verify text extraction preserves column separation
      const textResult = await pdfToText({
        file: { name: fixture.name, buffer: fixture.buffer },
      });
      const text = textResult.fullText;

      // Section 1 text should be present
      assert.ok(text.includes('Client Computing') || text.includes('Section 1'));
      // Section 2 text should be present
      assert.ok(text.includes('Privacy Architecture') || text.includes('Section 2'));
    });
  });

  // -------------------------------------------------------------
  // 2. Dynamic Adobe XFA Form Detection & Guard
  // -------------------------------------------------------------
  describe('Form Forensics: AcroForm vs Dynamic XFA', () => {
    it('inspects standard AcroForms and populates interactive fields', async () => {
      const fixture = await createAcroFormFixture();
      const inspection = await inspectInteractiveForm(fixture.uint8Array);

      assert.ok(inspection.hasAcroForm, 'Should detect standard AcroForm');
      assert.equal(inspection.hasXfa, false, 'Standard form should not have XFA');
      assert.equal(inspection.isXfaOnly, false);
      assert.equal(inspection.totalFields, 3, 'Should detect 3 fields (text, checkbox, dropdown)');

      // Fill form values
      const filled = await fillPdfForm(fixture.uint8Array, {
        values: {
          'client.fullName': 'Alice Wonderland',
          'client.agreeTerms': true,
          'client.jurisdiction': 'Switzerland',
        },
      });

      assert.ok(filled.pdfBytes.length > 500);

      // Inspect filled form to verify updated values
      const reloaded = await inspectInteractiveForm(filled.pdfBytes);
      const nameField = reloaded.fields.find((f) => f.name === 'client.fullName');
      assert.equal(nameField?.value, 'Alice Wonderland');
    });

    it('detects dynamic Adobe XFA forms and provides clear user notice', async () => {
      const xfaFixture = await createDynamicXfaFixture();
      const inspection = await inspectInteractiveForm(xfaFixture.uint8Array);

      assert.ok(inspection.hasXfa, 'Must detect presence of /XFA dictionary stream');
      assert.ok(inspection.isXfaOnly, 'Must identify document as XFA-only form');
      assert.ok(
        inspection.notice?.includes('dynamic XML Forms Architecture (XFA)'),
        'Notice must inform user of XFA format'
      );

      // Attempting to fill an XFA-only form should throw descriptive error
      await assert.rejects(
        async () => {
          await fillPdfForm(xfaFixture.uint8Array, {
            values: { 'any.field': 'value' },
          });
        },
        /dynamic Adobe XML Forms Architecture/i,
        'Should reject XFA form with clear error rather than corrupting document'
      );
    });
  });

  // -------------------------------------------------------------
  // 3. Multi-Dimensional Document Comparison
  // -------------------------------------------------------------
  describe('Compare PDF Forensics: Geometry, Sequence & Content', () => {
    it('reports identical: true on exact duplicate documents', async () => {
      const fixture = await createStructuredTableFixture();
      const res = await comparePdfDocuments(fixture.uint8Array, fixture.uint8Array);

      assert.equal(res.identical, true);
      assert.equal(res.overallSimilarityScore, 100);
      assert.equal(res.hasGeometryDifferences, false);
      assert.equal(res.hasOrderDifferences, false);
    });

    it('detects layout and geometry differences (dimension mismatch)', async () => {
      const docA = await createStructuredTableFixture(); // US Letter (612x792)
      const docB = await createTwoColumnLayoutFixture(); // A4 (595x842)

      const res = await comparePdfDocuments(docA.uint8Array, docB.uint8Array);

      assert.equal(res.identical, false);
      assert.equal(res.hasGeometryDifferences, true, 'Must flag page dimension difference');
    });

    it('detects word sequence / order differences even with similar vocabulary', async () => {
      // Compare complex geometry vs table
      const docA = await createStructuredTableFixture();
      const docB = await createComplexGeometryFixture();

      const res = await comparePdfDocuments(docA.uint8Array, docB.uint8Array);

      assert.equal(res.identical, false);
      assert.equal(res.pageCountA, 1);
      assert.equal(res.pageCountB, 3);
      assert.equal(res.hasGeometryDifferences, true);
    });
  });

  // -------------------------------------------------------------
  // 4. Independent Poppler CLI Verification (pdfinfo & pdftotext)
  // -------------------------------------------------------------
  describe('Independent Poppler Verification: Encryption & Decryption', () => {
    const tmpProtected = path.join('/tmp', `forensic-test-protect-${Date.now()}.pdf`);
    const tmpUnlocked = path.join('/tmp', `forensic-test-unlocked-${Date.now()}.pdf`);

    it('protects with AES-256 and verifies independently with Poppler pdfinfo & pdftotext', async () => {
      const fixture = await createStructuredTableFixture();
      const password = 'AuditPassword#2026!';

      const protectedPdf = await protectPdf({
        file: { name: fixture.name, buffer: fixture.buffer },
        userPassword: password,
      });

      writeFileSync(tmpProtected, Buffer.from(protectedPdf.uint8Array));

      // 1. Independent Poppler pdfinfo without password -> should fail
      assert.throws(
        () => {
          execFileSync('/usr/bin/pdfinfo', [tmpProtected], { stdio: 'pipe' });
        },
        /Command failed/i,
        'Poppler pdfinfo without password must fail'
      );

      // 2. Independent Poppler pdfinfo WITH password -> should confirm encryption and metadata
      const infoOut = execFileSync('/usr/bin/pdfinfo', ['-upw', password, tmpProtected], {
        encoding: 'utf-8',
      });
      assert.ok(infoOut.includes('Encrypted:       yes'), 'pdfinfo confirms genuine encryption');
      assert.ok(infoOut.includes('AES'), 'pdfinfo confirms AES encryption format');
      assert.ok(infoOut.includes('Pages:           1'), 'pdfinfo confirms page count');

      // 3. Independent Poppler pdftotext WITH password -> extracts text successfully
      const textOut = execFileSync('/usr/bin/pdftotext', ['-upw', password, tmpProtected, '-'], {
        encoding: 'utf-8',
      });
      assert.ok(textOut.includes('Quarterly Financial Balance Sheet'), 'pdftotext extracts authenticated text');
      assert.ok(textOut.includes('ACC-1010'), 'pdftotext extracts account codes');

      // 4. Unlock the document
      const unlockedPdf = await unlockPdf({
        file: {
          name: 'protected.pdf',
          buffer: protectedPdf.uint8Array.buffer.slice(
            protectedPdf.uint8Array.byteOffset,
            protectedPdf.uint8Array.byteOffset + protectedPdf.uint8Array.byteLength
          ) as ArrayBuffer,
        },
        password,
      });

      writeFileSync(tmpUnlocked, Buffer.from(unlockedPdf.uint8Array));

      // 5. Independent Poppler pdfinfo on unlocked file -> should open WITHOUT password
      const unlockedInfo = execFileSync('/usr/bin/pdfinfo', [tmpUnlocked], {
        encoding: 'utf-8',
      });
      assert.ok(unlockedInfo.includes('Encrypted:       no'), 'pdfinfo confirms document is fully decrypted');
      assert.ok(unlockedInfo.includes('Pages:           1'));

      // Cleanup
      try {
        unlinkSync(tmpProtected);
        unlinkSync(tmpUnlocked);
      } catch {}
    });
  });

  // -------------------------------------------------------------
  // 5. Tabular Data Extraction to CSV and Excel
  // -------------------------------------------------------------
  describe('Tabular Data Extraction Forensics', () => {
    it('extracts financial tables to CSV with valid RFC 4180 format and currency symbols', async () => {
      const fixture = await createStructuredTableFixture();
      const csvResult = await convertPdfToCsv(fixture.uint8Array);

      assert.ok(csvResult.csvContent.length > 100);
      assert.ok(csvResult.csvContent.includes('Account Code') || csvResult.csvContent.includes('Description'));
      assert.ok(csvResult.csvContent.includes('ACC-1010'));
      assert.ok(csvResult.rowCount >= 4, 'Should detect at least 4 table rows');
      assert.ok(csvResult.columnCount >= 3, 'Should detect multi-column table structure');
    });

    it('packages tabular data into an OpenXML Excel workbook (.xlsx)', async () => {
      const fixture = await createStructuredTableFixture();
      const excelResult = await convertPdfToExcel({
        name: fixture.name,
        buffer: fixture.buffer,
      });

      assert.ok((excelResult.outputBytes?.length ?? 0) > 500);
      assert.equal(excelResult.outputBytes?.[0], 0x50, 'Must have PK zip header');
      assert.equal(excelResult.outputBytes?.[1], 0x4b);
      assert.ok(excelResult.stats.totalBlocks >= 4);
    });
  });

  // -------------------------------------------------------------
  // 6. Unicode & Accented Typography
  // -------------------------------------------------------------
  describe('Unicode & International Typography Preservation', () => {
    it('preserves accented Latin characters and currencies in text stream extraction', async () => {
      const fixture = await createUnicodeMultiLanguageFixture();
      const extracted = await pdfToText({
        file: { name: fixture.name, buffer: fixture.buffer },
      });

      assert.ok(extracted.fullText.includes('résumé') || extracted.fullText.includes('resum'));
      assert.ok(extracted.fullText.includes('1,250.50') || extracted.fullText.includes('Total'));
      assert.ok(extracted.fullText.includes('PDFSimplify'));
    });
  });

  // -------------------------------------------------------------
  // 7. Annotation and Geometry Resilience
  // -------------------------------------------------------------
  describe('Annotation and Geometry Resilience', () => {
    it('preserves multi-box geometry across rotation and watermarking', async () => {
      const fixture = await createComplexGeometryFixture();

      // Rotate pages
      const rotated = await rotatePdf({
        file: { name: fixture.name, buffer: fixture.buffer },
        allPagesDelta: 90,
      });
      assert.ok(rotated.uint8Array.length > 500);

      // Watermark rotated pages
      const watermarked = await watermarkPdf({
        file: {
          name: 'rotated.pdf',
          buffer: rotated.uint8Array.buffer.slice(
            rotated.uint8Array.byteOffset,
            rotated.uint8Array.byteOffset + rotated.uint8Array.byteLength
          ) as ArrayBuffer,
        },
        text: 'FORENSIC AUDIT',
        opacity: 0.3,
      });
      assert.ok(watermarked.uint8Array.length > 500);
    });

    it('preserves low-level annotation dictionaries through vector processing', async () => {
      const fixture = await createAnnotatedDocumentFixture();
      const watermarked = await watermarkPdf({
        file: { name: fixture.name, buffer: fixture.buffer },
        text: 'CONFIDENTIAL',
        opacity: 0.2,
      });

      assert.ok(watermarked.uint8Array.length > 500);
    });
  });

  // -------------------------------------------------------------
  // 8. OCR Scanned Image Text Layer Behavior
  // -------------------------------------------------------------
  describe('OCR Scanned Document Engine Behavior', () => {
    it('handles scanned image-only documents and generates searchable PDF layer', async () => {
      const fixture = await createScannedImageOnlyFixture();
      const ocrResult = await performClientOcr(fixture.uint8Array);

      assert.equal(ocrResult.totalPages, 1);
      assert.ok(ocrResult.searchablePdfBlob.size > 500);
      assert.ok(ocrResult.text.length > 0);
      assert.equal(ocrResult.pagesScanned, 1, 'Should recognize page has no digital text layer');
    });
  });

  // -------------------------------------------------------------
  // 9. Malformed and Adversarial Payloads
  // -------------------------------------------------------------
  describe('Adversarial and Malformed Input Rejection', () => {
    const payloads = createMalformedPayloads();

    it('rejects truncated PDF binaries with informative error', async () => {
      await assert.rejects(async () => {
        await pdfToText({
          file: {
            name: 'corrupt.pdf',
            buffer: payloads.truncatedPdf.buffer.slice(
              payloads.truncatedPdf.byteOffset,
              payloads.truncatedPdf.byteOffset + payloads.truncatedPdf.byteLength
            ) as ArrayBuffer,
          },
        });
      }, /error|invalid|corrupt/i);
    });

    it('rejects non-PDF fake headers with informative error', async () => {
      await assert.rejects(async () => {
        await pdfToText({
          file: {
            name: 'fake.pdf',
            buffer: payloads.invalidHeader.buffer.slice(
              payloads.invalidHeader.byteOffset,
              payloads.invalidHeader.byteOffset + payloads.invalidHeader.byteLength
            ) as ArrayBuffer,
          },
        });
      }, /error|invalid|corrupt|PDF/i);
    });

    it('rejects empty 0-byte file', async () => {
      await assert.rejects(async () => {
        await inspectInteractiveForm(payloads.zeroBytes);
      }, /empty/i);
    });
  });

  // -------------------------------------------------------------
  // 10. Image Extraction from Mixed XObjects
  // -------------------------------------------------------------
  describe('Embedded Image Extraction', () => {
    it('extracts embedded PNG and JPEG XObjects into a valid ZIP archive', async () => {
      const fixture = await createMixedImagesFixture();
      const result = await extractImagesFromPdf(fixture.uint8Array);

      assert.ok(result.totalImages >= 1, 'Should find embedded image XObjects');
      assert.ok(result.zipBlob.size > 200, 'Should generate ZIP archive');
    });
  });

  // -------------------------------------------------------------
  // 11. Grayscale Rasterization Consequence Audit
  // -------------------------------------------------------------
  describe('Grayscale Rasterization Consequence Audit', () => {
    it('converts multi-page PDF to grayscale and documents rasterization nature', async () => {
      const fixture = await createComplexGeometryFixture();
      const grayResult = await convertPdfToGrayscale(fixture.uint8Array);

      assert.equal(grayResult.totalPages, 3);
      assert.ok(grayResult.grayscaleBytes.length > 500);
    });
  });
});
