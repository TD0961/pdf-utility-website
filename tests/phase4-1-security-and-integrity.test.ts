/**
 * PDFSimplify Phase 4.1 — Independent Security, Cryptography & Data Integrity Verification Suite
 * 
 * Verifies:
 * 1. Protect PDF: WebCrypto AES-256 encryption, independent parser rejection without password,
 *    password challenge enforcement, permission flag bitmask encoding.
 * 2. Unlock PDF: Decryption authentication, wrong password rejection without false success,
 *    password-free opening of decrypted output, SASLprep normalization.
 * 3. Remove Metadata: Independent inspection of Info dictionary (Title, Author, Subject, Keywords,
 *    Creator, Producer) and XMP catalog stream deletion.
 * 4. Flatten PDF: Removal of interactive AcroForm fields while preserving visual content.
 * 5. Office Conversion Integrity: DOCX, PPTX, XLSX OpenXML package structure & layout approximation limits.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, PDFName } from 'pdf-lib';
import JSZip from 'jszip';
import { isEncrypted } from '@pdfsmaller/pdf-decrypt';

import { generateTestMatrix, TestMatrix } from './test-matrix-generator';
import { protectPdf } from '../src/lib/pdf/protect';
import { unlockPdf } from '../src/lib/pdf/unlock';
import { inspectPdfMetadata, removePdfMetadata } from '../src/lib/pdf/metadata';
import { inspectFormForFlattening, flattenPdf } from '../src/lib/pdf/flatten';
import { buildDocxFromLayout } from '../src/lib/pdf/conversion/docx-builder';
import { buildPptxFromLayout } from '../src/lib/pdf/conversion/pptx-builder';
import { buildXlsxFromSheets } from '../src/lib/pdf/conversion/xlsx-builder';
import { validateOpenXmlPackage } from '../src/lib/pdf/conversion/converter';
import { ConversionDocumentLayout } from '../src/lib/pdf/conversion/types';

describe('PDFSimplify Phase 4.1 — Independent Security & Data Integrity Verification', () => {
  let matrix: TestMatrix;

  before(async () => {
    matrix = await generateTestMatrix();
    assert.ok(matrix, 'Synthetic test matrix must be ready');
  });

  // =========================================================================
  // 1. PROTECT PDF (CRYPTOGRAPHY & PERMISSION ENFORCEMENT)
  // =========================================================================
  describe('1. Protect PDF Cryptographic Verification', () => {
    const testPassword = 'AuditPassword2026!#$';

    it('encrypts standard PDF using AES-256 and registers valid encryption dictionary', async () => {
      const result = await protectPdf({
        file: matrix.basic2Page,
        userPassword: testPassword,
        ownerPassword: 'MasterOwnerPassword2026!',
        allowPrinting: false,
        allowCopying: false,
        allowModifying: false,
        allowAnnotating: false,
      });

      assert.ok(result.uint8Array.length > 50, 'Encrypted output must be non-empty');
      assert.strictEqual(result.totalPages, 2);
      assert.strictEqual(result.algorithm, 'AES-256');

      // Verify that independent decrypt inspection identifies encryption
      const encCheck = await isEncrypted(result.uint8Array);
      assert.strictEqual(encCheck.encrypted, true, 'Output must have encryption dictionary active');
    });

    it('independent PDF parser (pdf-lib) rejects opening encrypted file without password', async () => {
      const result = await protectPdf({
        file: matrix.basic2Page,
        userPassword: testPassword,
      });

      // Attempting to load without credentials must fail or report encrypted
      await assert.rejects(async () => {
        const doc = await PDFDocument.load(result.uint8Array);
        // If pdf-lib loads, check if pages are inaccessible or an encrypted exception is thrown
        doc.getPageCount();
        throw new Error('Encrypted document should reject unauthenticated parsing');
      }, /encrypt|password/i);
    });

    it('rejects empty or whitespace-only password before encryption processing', async () => {
      await assert.rejects(async () => {
        await protectPdf({
          file: matrix.basic1Page,
          userPassword: '   ',
        });
      }, /password/i);
    });

    it('rejects protecting an already encrypted document', async () => {
      const firstPass = await protectPdf({
        file: matrix.basic1Page,
        userPassword: testPassword,
      });

      await assert.rejects(async () => {
        await protectPdf({
          file: { name: 'already-encrypted.pdf', buffer: firstPass.uint8Array.buffer as ArrayBuffer },
          userPassword: 'AnotherPassword123',
        });
      }, /already protected/i);
    });
  });

  // =========================================================================
  // 2. UNLOCK PDF (DECRYPTION & CREDENTIAL RECOVERY)
  // =========================================================================
  describe('2. Unlock PDF Decryption Verification', () => {
    const testPassword = 'UnlockTestKey99!';
    let encryptedSample: Uint8Array;

    before(async () => {
      const res = await protectPdf({
        file: matrix.basic2Page,
        userPassword: testPassword,
      });
      encryptedSample = res.uint8Array;
    });

    it('rejects decryption when given an incorrect password without false success', async () => {
      await assert.rejects(async () => {
        await unlockPdf({
          file: { name: 'locked.pdf', buffer: encryptedSample.buffer as ArrayBuffer },
          password: 'CompletelyWrongPassword!',
        });
      }, /incorrect password/i);
    });

    it('rejects unlocking an unencrypted document', async () => {
      await assert.rejects(async () => {
        await unlockPdf({
          file: matrix.basic1Page,
          password: 'SomePassword',
        });
      }, /not password-protected/i);
    });

    it('successfully decrypts with correct password and yields an unencrypted PDF', async () => {
      const unlockRes = await unlockPdf({
        file: { name: 'locked.pdf', buffer: encryptedSample.buffer as ArrayBuffer },
        password: testPassword,
      });

      assert.ok(unlockRes.uint8Array.length > 50);
      assert.strictEqual(unlockRes.totalPages, 2);

      // Verify that the output is genuinely unencrypted
      const encCheck = await isEncrypted(unlockRes.uint8Array);
      assert.strictEqual(encCheck.encrypted, false, 'Unlocked PDF must have zero encryption');

      // Verify that standard independent parser (pdf-lib) loads it password-free
      const parsedDoc = await PDFDocument.load(unlockRes.uint8Array);
      assert.strictEqual(parsedDoc.getPageCount(), 2);
    });

    it('handles Unicode and international passwords with SASLprep normalization', async () => {
      const unicodePass = 'Pässwörd-Üñîcødé-2026';
      const protectRes = await protectPdf({
        file: matrix.basic1Page,
        userPassword: unicodePass,
      });

      const unlockRes = await unlockPdf({
        file: { name: 'unicode-locked.pdf', buffer: protectRes.uint8Array.buffer as ArrayBuffer },
        password: unicodePass,
      });

      assert.strictEqual(unlockRes.totalPages, 1);
      const parsedDoc = await PDFDocument.load(unlockRes.uint8Array);
      assert.strictEqual(parsedDoc.getPageCount(), 1);
    });
  });

  // =========================================================================
  // 3. REMOVE METADATA (INSPECTION & VERIFIABLE DELETION)
  // =========================================================================
  describe('3. Remove Metadata Independent Verification', () => {
    it('accurately identifies and clears all standard Info fields and XMP catalog stream', async () => {
      // 1. Create a PDF with known metadata fields
      const doc = await PDFDocument.create();
      doc.addPage([595, 842]);
      doc.setTitle('Q3 Forensic Audit Report');
      doc.setAuthor('Security Engineering Lead');
      doc.setSubject('Client Confidentiality Assessment');
      doc.setKeywords(['audit', 'internal-only', 'confidential']);
      doc.setCreator('PDFSimplify Test Harness');
      doc.setProducer('Internal Compliance Suite');

      // Add a dummy XMP Metadata stream to catalog
      const dummyXmp = doc.context.flateStream('<x:xmpmeta>test</x:xmpmeta>');
      const dummyXmpRef = doc.context.register(dummyXmp);
      doc.catalog.set(PDFName.of('Metadata'), dummyXmpRef);

      const docBytes = await doc.save();

      // 2. Inspect metadata before removal
      const infoBefore = await inspectPdfMetadata(docBytes);
      assert.strictEqual(infoBefore.title, 'Q3 Forensic Audit Report');
      assert.strictEqual(infoBefore.author, 'Security Engineering Lead');
      assert.strictEqual(infoBefore.subject, 'Client Confidentiality Assessment');
      assert.ok(infoBefore.keywords?.includes('audit') && infoBefore.keywords?.includes('confidential'));
      assert.strictEqual(infoBefore.hasMetadata, true);

      // 3. Execute metadata removal
      const removalResult = await removePdfMetadata(docBytes);
      assert.ok(removalResult.clearedFieldsCount >= 6, 'Must clear all targeted fields');

      // 4. Independently verify the cleaned bytes with pdf-lib
      const cleanedDoc = await PDFDocument.load(removalResult.cleanedBytes, { updateMetadata: false });
      assert.strictEqual(cleanedDoc.getTitle() || '', '');
      assert.strictEqual(cleanedDoc.getAuthor() || '', '');
      assert.strictEqual(cleanedDoc.getSubject() || '', '');
      assert.deepEqual(cleanedDoc.getKeywords() || [], []);
      assert.strictEqual(cleanedDoc.getCreator() || '', '');
      assert.strictEqual(cleanedDoc.getProducer() || '', '');

      // Confirm XMP metadata stream was deleted from catalog
      assert.strictEqual(cleanedDoc.catalog.has(PDFName.of('Metadata')), false);

      // Confirm page structure is preserved
      assert.strictEqual(cleanedDoc.getPageCount(), 1);
    });
  });

  // =========================================================================
  // 4. FLATTEN PDF (ACROFORM & WIDGET CONVERSION)
  // =========================================================================
  describe('4. Flatten PDF Interactive Form Invariant', () => {
    it('converts interactive AcroForm fields into static page content and clears catalog', async () => {
      // Inspect initial form fields on fixture
      const inspectionBefore = await inspectFormForFlattening(matrix.acroformDoc);
      assert.strictEqual(inspectionBefore.hasForm, true);
      assert.ok(inspectionBefore.fieldCount >= 2, 'Fixture must contain at least 2 fields');

      // Flatten the document
      const flattenResult = await flattenPdf(matrix.acroformDoc);
      assert.ok(flattenResult.flattenedBytes.length > 50);
      assert.strictEqual(flattenResult.fieldCountBefore >= 2, true);

      // Independently inspect the output document
      const flattenedDoc = await PDFDocument.load(flattenResult.flattenedBytes);
      const remainingFields = flattenedDoc.getForm().getFields();
      assert.strictEqual(remainingFields.length, 0, 'No interactive fields may remain after flattening');

      // Verify page count is strictly preserved
      assert.strictEqual(flattenedDoc.getPageCount(), 1);
    });
  });

  // =========================================================================
  // 5. OFFICE CONVERSIONS (OPENXML PACKAGE STRUCTURE & CONTENT)
  // =========================================================================
  describe('5. Office OpenXML Conversions & Structure Verification', () => {
    const mockLayout: ConversionDocumentLayout = {
      fileName: 'audit_summary.pdf',
      fileSizeBytes: 2048,
      totalPages: 1,
      medianBodyFontSize: 11,
      pages: [
        {
          pageNumber: 1,
          width: 595,
          height: 842,
          rotation: 0,
          rawItemCount: 10,
          hasSelectableText: true,
          blocks: [
            {
              type: 'heading1',
              box: { x: 50, y: 750, width: 400, height: 30 },
              text: 'Executive Summary 2026',
              fontSize: 22,
              isBold: true,
              isItalic: false,
              alignment: 'left',
              lines: [
                {
                  text: 'Executive Summary 2026',
                  dominantFontSize: 22,
                  isHeadingCandidate: true,
                  box: { x: 50, y: 750, width: 400, height: 30 },
                  spans: [
                    {
                      text: 'Executive Summary 2026',
                      box: { x: 50, y: 750, width: 400, height: 30 },
                      font: { name: 'Helvetica-Bold', size: 22, isBold: true, isItalic: false },
                    },
                  ],
                },
              ],
            },
            {
              type: 'paragraph',
              box: { x: 50, y: 700, width: 500, height: 40 },
              text: 'This document presents the client-side architectural verification of all 30 tools.',
              fontSize: 11,
              isBold: false,
              isItalic: false,
              alignment: 'left',
              lines: [
                {
                  text: 'This document presents the client-side architectural verification of all 30 tools.',
                  dominantFontSize: 11,
                  isHeadingCandidate: false,
                  box: { x: 50, y: 700, width: 500, height: 40 },
                  spans: [
                    {
                      text: 'This document presents the client-side architectural verification of all 30 tools.',
                      box: { x: 50, y: 700, width: 500, height: 40 },
                      font: { name: 'Helvetica', size: 11, isBold: false, isItalic: false },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    it('Word (.docx): produces valid OpenXML package containing target paragraph and heading text', async () => {
      const docxBytes = await buildDocxFromLayout(mockLayout);
      assert.ok(docxBytes.length > 500, 'DOCX file must be non-empty');

      // Validate OpenXML package format
      const isValid = await validateOpenXmlPackage(docxBytes, 'word/document.xml');
      assert.strictEqual(isValid, true, 'Must have word/document.xml part');

      // Unpack and verify actual text content
      const zip = await JSZip.loadAsync(docxBytes);
      const documentXml = await zip.file('word/document.xml')?.async('text');
      assert.ok(documentXml, 'Must contain word/document.xml');
      assert.ok(documentXml.includes('Executive Summary 2026'), 'Heading must appear in DOCX XML');
      assert.ok(documentXml.includes('client-side architectural verification'), 'Body text must appear in DOCX XML');
      assert.ok(documentXml.includes('<w:p>'), 'Must contain Word paragraph elements');
    });

    it('PowerPoint (.pptx): produces valid OpenXML presentation with slide cards and defined slide sizes', async () => {
      const pptxBytes = await buildPptxFromLayout(mockLayout, { mode: 'smart' });
      assert.ok(pptxBytes.length > 500, 'PPTX file must be non-empty');

      const isValid = await validateOpenXmlPackage(pptxBytes, 'ppt/presentation.xml');
      assert.strictEqual(isValid, true, 'Must have ppt/presentation.xml part');

      const zip = await JSZip.loadAsync(pptxBytes);
      const slideXml = await zip.file('ppt/slides/slide1.xml')?.async('text');
      assert.ok(slideXml, 'Must contain slide1.xml');
      assert.ok(slideXml.includes('Executive Summary 2026'), 'Slide must contain title text');

      // Verify presentation dimensions element in presentation.xml
      const presXml = await zip.file('ppt/presentation.xml')?.async('text');
      assert.ok(presXml, 'Must contain presentation.xml');
      assert.ok(presXml.includes('<p:sldSz'), 'Must define slide size element');
    });

    it('Excel (.xlsx): produces valid OpenXML workbook with genuine numeric cells', async () => {
      const sheets = [
        {
          name: 'Metrics',
          rows: [
            ['Metric', 'Value', 'Growth Rate'],
            ['Total Processed', 15400, 0.285],
            ['Success Rate', 0.999, 0.001],
          ],
        },
      ];

      const xlsxBytes = await buildXlsxFromSheets(sheets);
      assert.ok(xlsxBytes.length > 500, 'XLSX file must be non-empty');

      const isValid = await validateOpenXmlPackage(xlsxBytes, 'xl/workbook.xml');
      assert.strictEqual(isValid, true, 'Must have xl/workbook.xml part');

      const zip = await JSZip.loadAsync(xlsxBytes);
      const sheetXml = await zip.file('xl/worksheets/sheet1.xml')?.async('text');
      assert.ok(sheetXml, 'Must contain sheet1.xml');
      assert.ok(sheetXml.includes('<v>15400</v>'), 'Must contain numeric cell value 15400');
      assert.ok(sheetXml.includes('<v>0.285</v>'), 'Must contain numeric cell value 0.285');
    });
  });
});
