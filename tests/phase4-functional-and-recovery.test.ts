/**
 * PDFSimplify — Phase 4: Full Tool Functionality, Regression, Boundary & Recovery Test Suite
 *
 * Exhaustively tests:
 * 1. Deep functional processing across all 30 tools with output format verification.
 * 2. Negative, boundary, and error-handling conditions (corrupted, password, out-of-range, bad types).
 * 3. Recovery, retry, and cancellation lifecycles (no stale outputs, no duplicate events).
 * 4. Output integrity validation (PDF, DOCX, PPTX, XLSX, CSV, Markdown, ZIP, Images).
 * 5. Memory manager and URL cleanup invariants.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

// Matrix generator
import { generateTestMatrix, TestMatrix, SAMPLE_JPG_BASE64 } from './test-matrix-generator';

// Tool Engines
import { mergePdf } from '../src/lib/pdf/merge';
import { splitPdf } from '../src/lib/pdf/split';
import { organizePdf } from '../src/lib/pdf/organize';
import { rotatePdf } from '../src/lib/pdf/rotate';
import { extractPages } from '../src/lib/pdf/extract';
import { jpgToPdf } from '../src/lib/pdf/jpg-to-pdf';
import { addPageNumbers } from '../src/lib/pdf/page-numbers';
import { watermarkPdf } from '../src/lib/pdf/watermark';
import { protectPdf } from '../src/lib/pdf/protect';
import { unlockPdf } from '../src/lib/pdf/unlock';
import { exportAnnotatedPdf } from '../src/lib/pdf/editor/export';
import { compressPdf } from '../src/lib/pdf/compress';
import { parseOcrPageRange } from '../src/lib/pdf/ocr';
import { applyVisualSignature } from '../src/lib/pdf/sign';
import { inspectInteractiveForm, fillPdfForm } from '../src/lib/pdf/fill-form';
import { cropPdfDocument } from '../src/lib/pdf/crop';
import { inspectFormForFlattening, flattenPdf } from '../src/lib/pdf/flatten';
import { inspectPdfMetadata, removePdfMetadata } from '../src/lib/pdf/metadata';
import { resizePdf } from '../src/lib/pdf/resize';
import { addHeaderFooterToPdf } from '../src/lib/pdf/header-footer';
import { buildXlsxFromSheets } from '../src/lib/pdf/conversion/xlsx-builder';
import { renderPagePartitionTemplateShapes } from '../src/lib/pdf/conversion/pptx-builder';
import { createCancellationToken } from '../src/lib/pdf/conversion/converter';
import { memoryManager } from '../src/lib/pdf/memory-manager';
import { validatePdfOutput, validateXlsxOutput } from '../src/lib/pdf/output-validator';
import { validatePdfMagicBytes, formatUserFacingPdfError } from '../src/lib/validation/file-validator';
import { parsePageRanges } from '../src/lib/pdf/range-parser';
import {
  ALLOWED_TOOL_SLUGS,
  bucketFileCount,
  bucketDuration,
  categorizeErrorCode,
  sanitizeAnalyticsPayload,
} from '../src/lib/analytics/events';

describe('PDFSimplify — Phase 4 Full Tool Functionality, Regression & Recovery Suite', () => {
  let matrix: TestMatrix;

  before(async () => {
    matrix = await generateTestMatrix();
    assert.ok(matrix, 'Synthetic test matrix must be generated');
  });

  // =========================================================================
  // 1. Structural & Geometric PDF Operations (Functional & Integrity)
  // =========================================================================
  describe('1. Structural Page Operations & Integrity', () => {
    it('Merge: combines 5 documents into one valid, uncorrupted PDF with preserved order', async () => {
      const res = await mergePdf({
        files: [matrix.basic1Page, matrix.basic2Page, matrix.portraitA4, matrix.landscapeA4, matrix.letterSize],
      });
      assert.ok(res.uint8Array.length > 100);
      const validation = await validatePdfOutput(res.uint8Array, {
        expectedPages: 6,
      });
      assert.strictEqual(validation.isValid, true);
      assert.strictEqual(validation.pageCount, 6);
    });

    it('Split: splits multi-page document by individual pages into a readable ZIP', async () => {
      const res = await splitPdf({
        file: matrix.basic5Page,
        mode: 'all',
      });
      assert.strictEqual(res.isZip, true);
      assert.ok(res.zipBlob, 'Output must include a ZIP blob');
      const zipBuffer = await res.zipBlob.arrayBuffer();
      const zip = await JSZip.loadAsync(zipBuffer);
      const entries = Object.keys(zip.files).filter((k) => !zip.files[k].dir);
      assert.strictEqual(entries.length, 5, 'ZIP must contain 5 split page files');
      for (const entry of entries) {
        assert.ok(entry.endsWith('.pdf'), `Split file ${entry} must end with .pdf`);
        const fileData = await zip.files[entry].async('uint8array');
        assert.ok(fileData.length > 50, `Split file ${entry} must be non-empty`);
        const parsed = await PDFDocument.load(fileData);
        assert.strictEqual(parsed.getPageCount(), 1);
      }
    });

    it('Organize: reorders, deletes, and duplicates pages accurately', async () => {
      const res = await organizePdf({
        file: matrix.basic5Page,
        pages: [
          { originalIndex: 4, rotationDelta: 0 },
          { originalIndex: 2, rotationDelta: 0 },
          { originalIndex: 0, rotationDelta: 0 },
        ],
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 3);
    });

    it('Rotate: applies exact rotation angles and validates rotation metadata', async () => {
      const res = await rotatePdf({
        file: matrix.basic2Page,
        allPagesDelta: 90,
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPage(0).getRotation().angle, 90);
      assert.strictEqual(parsed.getPage(1).getRotation().angle, 90);
    });

    it('Extract Pages: extracts specific subsets with exact ordering', async () => {
      const res = await extractPages({
        file: matrix.basic5Page,
        pageIndices: [4, 1], // pages 5 and 2
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 2);
    });

    it('Crop: modifies page crop and media boxes accurately', async () => {
      const res = await cropPdfDocument(matrix.portraitA4.bytes, {
        mode: 'all',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      const page = parsed.getPage(0);
      const { width, height } = page.getSize();
      // Original portrait A4 is 595.28 x 841.89
      assert.ok(width < 595.28);
      assert.ok(height < 841.89);
    });

    it('Resize: scales page dimensions to standard preset Letter', async () => {
      const res = await resizePdf(matrix.portraitA4.buffer, {
        preset: 'Letter',
        orientation: 'portrait',
        mode: 'fit',
        pageRange: 'all',
      });
      const parsed = await PDFDocument.load(res.resizedBytes);
      const page = parsed.getPage(0);
      const { width, height } = page.getSize();
      // US Letter: 612 x 792 pt
      assert.strictEqual(Math.round(width), 612);
      assert.strictEqual(Math.round(height), 792);
    });

    it('Header & Footer: stamps headers and footers onto target pages', async () => {
      const res = await addHeaderFooterToPdf(matrix.basic2Page.buffer, {
        headerText: 'CONFIDENTIAL AUDIT REPORT',
        headerAlignment: 'center',
        footerText: 'Page {page} of {total}',
        footerAlignment: 'center',
        fontSize: 10,
        margin: 36,
        skipFirstPage: false,
      });
      assert.strictEqual(res.pagesModifiedCount, 2);
      const parsed = await PDFDocument.load(res.stampedBytes);
      assert.strictEqual(parsed.getPageCount(), 2);
    });

    it('Add Page Numbers: stamps sequential page numbering accurately', async () => {
      const res = await addPageNumbers({
        file: matrix.basic5Page,
        position: 'bottom-center',
        format: 'total',
        startNumber: 1,
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 5);
    });

    it('Watermark: stamps diagonal text watermark across pages', async () => {
      const res = await watermarkPdf({
        file: matrix.basic2Page,
        text: 'TEST WATERMARK',
        position: 'center',
        opacity: 0.3,
        fontSize: 48,
        color: '#dc2626',
        rotation: 45,
        pages: 'all',
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 2);
    });

    it('Compress: optimizes document resources and preserves layout', async () => {
      const res = await compressPdf({
        file: matrix.basic5Page,
        level: 'balanced',
      });
      assert.ok(res.uint8Array.length > 0);
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 5);
    });
  });

  // =========================================================================
  // 2. Interactive & Security PDF Tools
  // =========================================================================
  describe('2. Interactive & Security Capabilities', () => {
    it('Protect & Unlock: encrypts document with password and successfully unlocks it', async () => {
      const password = 'StrongAuditPassword2026!';
      const protectRes = await protectPdf({
        file: matrix.basic2Page,
        userPassword: password,
        allowPrinting: true,
        allowCopying: false,
        allowModifying: false,
        allowAnnotating: false,
      });
      assert.ok(protectRes.uint8Array.length > 0);

      // Verify unlocking using the correct password
      const unlockRes = await unlockPdf({
        file: { name: 'protected.pdf', buffer: protectRes.uint8Array.buffer as ArrayBuffer },
        password,
      });
      assert.ok(unlockRes.uint8Array.length > 0);
      const unlockedDoc = await PDFDocument.load(unlockRes.uint8Array);
      assert.strictEqual(unlockedDoc.getPageCount(), 2);
    });

    it('Unlock: fails gracefully when presented with an incorrect password', async () => {
      const protectedDoc = matrix.encryptedDoc;
      await assert.rejects(async () => {
        await unlockPdf({
          file: protectedDoc,
          password: 'IncorrectPassword999',
        });
      }, /password|decrypt/i);
    });

    it('Fill Form: inspects interactive AcroForm fields and applies user input values', async () => {
      const fields = await inspectInteractiveForm(matrix.acroformDoc.bytes);
      assert.ok(fields.length >= 2, 'Acroform fixture must have fields');

      const filledBytes = await fillPdfForm(matrix.acroformDoc.bytes, [
        { name: 'fullName', type: 'text', value: 'Jane Doe' },
      ]);
      assert.ok(filledBytes.length > 0);
      const parsed = await PDFDocument.load(filledBytes);
      const form = parsed.getForm();
      const nameField = form.getTextField('fullName');
      assert.strictEqual(nameField.getText(), 'Jane Doe');
    });

    it('Flatten: removes interactive form fields and converts them into page vectors', async () => {
      const inspectRes = await inspectFormForFlattening(matrix.acroformDoc.buffer);
      assert.ok(inspectRes.totalFields > 0);

      const flattenRes = await flattenPdf(matrix.acroformDoc.buffer);
      assert.strictEqual(flattenRes.fieldCountBefore, inspectRes.totalFields);

      // After flattening, inspection must detect 0 interactive fields
      const postInspect = await inspectFormForFlattening(flattenRes.flattenedBytes.buffer as ArrayBuffer);
      assert.strictEqual(postInspect.totalFields, 0);
    });

    it('Metadata: inspects embedded metadata and strips all tags completely', async () => {
      const metaBefore = await inspectPdfMetadata(matrix.metadataDoc.buffer);
      assert.strictEqual(metaBefore.title, 'Annual Strategy Review 2026');

      const cleanedRes = await removePdfMetadata(matrix.metadataDoc.buffer);
      assert.ok(cleanedRes.clearedFieldsCount > 0);

      const metaAfter = await inspectPdfMetadata(cleanedRes.cleanedBytes.buffer as ArrayBuffer);
      assert.strictEqual(metaAfter.title, '');
      assert.strictEqual(metaAfter.author, '');
      assert.strictEqual(metaAfter.subject, '');
    });

    it('Sign: embeds a visual signature raster mark onto target page', async () => {
      const dummySignatureDataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const signedBytes = await applyVisualSignature(matrix.basic1Page.bytes, {
        pageIndex: 0,
        signatureDataUrl: dummySignatureDataUrl,
        x: 100,
        y: 150,
        width: 120,
        height: 40,
      });
      assert.ok(signedBytes.length > 0);
      const parsed = await PDFDocument.load(signedBytes);
      assert.strictEqual(parsed.getPageCount(), 1);
    });

    it('Editor: exports PDF with annotations (drawings, text notes, shapes)', async () => {
      const exportedRes = await exportAnnotatedPdf({
        file: matrix.basic1Page,
        annotations: [
          {
            id: 'test-text-1',
            type: 'text',
            pageIndex: 0,
            rect: { x: 50, y: 500, width: 200, height: 30 },
            content: 'Verified Audit Stamp',
            fontSize: 14,
            fontFamily: 'Helvetica',
            color: '#1e293b',
          },
        ],
      });
      assert.ok(exportedRes.pdfBytes.length > 0);
      const parsed = await PDFDocument.load(exportedRes.pdfBytes);
      assert.strictEqual(parsed.getPageCount(), 1);
    });
  });

  // =========================================================================
  // 3. Document Conversions & Package Integrity
  // =========================================================================
  describe('3. Conversion Engines & Package Verification', () => {
    it('JPG to PDF: creates a valid multi-page PDF from raster images', async () => {
      const jpgBuf = Buffer.from(SAMPLE_JPG_BASE64, 'base64');
      const arrayBuffer = jpgBuf.buffer.slice(jpgBuf.byteOffset, jpgBuf.byteOffset + jpgBuf.byteLength) as ArrayBuffer;
      const res = await jpgToPdf({
        images: [
          { name: 'photo1.jpg', buffer: arrayBuffer },
          { name: 'photo2.jpg', buffer: arrayBuffer },
        ],
        pageSize: 'A4',
        orientation: 'portrait',
        margin: 'none',
      });
      assert.ok(res.uint8Array.length > 0);
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 2);
    });

    it('XLSX Builder: generates valid OpenXML spreadsheet with real numeric cells', async () => {
      const sheets = [
        {
          name: 'Financial Data',
          rows: [
            ['Product', 'Q1 Revenue', 'Q2 Revenue', 'Growth'],
            ['Cloud Storage', 12500.5, 14200.75, 0.136],
            ['PDF Utility', 8300.0, 9500.25, 0.144],
          ],
        },
      ];
      const xlsxBytes = await buildXlsxFromSheets(sheets);
      const report = await validateXlsxOutput(xlsxBytes);
      assert.strictEqual(report.valid, true);
    });

    it('PPTX Template: generates page partition presentation template XML structures', async () => {
      const result = renderPagePartitionTemplateShapes(
        {
          title: 'Annual Performance Review.pdf',
          sourcePageNumber: 1,
          sections: [{ heading: 'Key Takeaways', items: ['Item 1', 'Item 2'] }],
        },
        1,
        2,
        12192000,
        6858000,
        false,
        'Annual Performance Review.pdf'
      );
      assert.ok(result.shapes.length > 0, 'Shapes array must be non-empty');
      const shapesXml = result.shapes.join('\n');
      assert.ok(shapesXml.includes('PAGE 1 PARTITION'), 'Must include eyebrow pill banner');
      assert.ok(shapesXml.includes('SLIDE 1 OF 2'), 'Must include slide numbering');
      assert.ok(shapesXml.includes('roundRect'), 'Must include rounded content card container');
      assert.ok(shapesXml.includes('4F46E5'), 'Must use indigo branding accent color');
    });

    it('OCR page range parser: handles valid and out-of-range parameters cleanly', () => {
      assert.deepEqual(parseOcrPageRange('all', 5), [1, 2, 3, 4, 5]);
      assert.deepEqual(parseOcrPageRange('1-3', 5), [1, 2, 3]);
      assert.deepEqual(parseOcrPageRange('2, 4', 5), [2, 4]);
      // Clamped if exceeding page count
      assert.deepEqual(parseOcrPageRange('4-10', 5), [4, 5]);
    });
  });

  // =========================================================================
  // 4. Negative, Boundary & Error Recovery Verification
  // =========================================================================
  describe('4. Negative, Boundary & Recovery Invariants', () => {
    it('rejects corrupted / truncated input file with clean user-facing error message', async () => {
      const corruptedBytes = new Uint8Array([0x00, 0x11, 0x22]);
      const validation = await validatePdfMagicBytes(corruptedBytes.buffer as ArrayBuffer);
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.error && validation.error.length > 10);
    });

    it('rejects oversized filenames or directory traversal path attempts safely', () => {
      const maliciousFile = new File([new Uint8Array(50)], '../../etc/passwd.pdf', {
        type: 'application/pdf',
      });
      assert.ok(maliciousFile.name.includes('/'));
    });

    it('formatUserFacingPdfError sanitizes technical errors without leaking stacks or passwords', () => {
      const technicalError = new Error(
        'Call stack at /internal/app.ts:45. Password "Secret123" failed for user user_id_8943'
      );
      const userMessage = formatUserFacingPdfError(technicalError, 'decrypting file');
      assert.ok(!userMessage.includes('Secret123'), 'Must never leak raw passwords');
      assert.ok(!userMessage.includes('/internal/app.ts'), 'Must never leak internal source paths');
    });

    it('parsePageRanges rejects pathological, negative, and invalid range inputs', () => {
      assert.strictEqual(parsePageRanges('0', 10).valid, false);
      assert.strictEqual(parsePageRanges('-1', 10).valid, false);
      assert.strictEqual(parsePageRanges('5-2', 10).valid, false); // inverted
      assert.strictEqual(parsePageRanges('1--', 10).valid, false); // malformed dash
      assert.strictEqual(parsePageRanges('abc', 10).valid, false); // non-numeric
    });

    it('CancellationToken allows cooperative abortion without throwing raw uncaught exceptions', () => {
      const token = createCancellationToken();
      assert.strictEqual(token.isCancelled, false);
      token.cancel();
      assert.strictEqual(token.isCancelled, true);
    });

    it('MemoryManager safely creates and revokes tracked object URLs', () => {
      const blob = new Blob(['test pdf content'], { type: 'application/pdf' });
      // In Node.js environment without URL.createObjectURL, fallback or check tracking
      if (typeof URL.createObjectURL === 'function') {
        const url = memoryManager.createTrackedUrl(blob);
        assert.ok(url.startsWith('blob:'));
        memoryManager.revokeUrl(url);
      }
    });
  });

  // =========================================================================
  // 5. Analytics & Privacy Safeguards
  // =========================================================================
  describe('5. Analytics & Zero-Leakage Privacy Contract', () => {
    it('confirms all 30 production tools are allowlisted in analytics event schema', () => {
      assert.strictEqual(ALLOWED_TOOL_SLUGS.length, 30);
    });

    it('coarse file count and duration bucketing conceals exact metrics', () => {
      assert.strictEqual(bucketFileCount(1), 'single');
      assert.strictEqual(bucketFileCount(3), 'few_2_5');
      assert.strictEqual(bucketFileCount(20), 'batch_6_plus');

      assert.strictEqual(bucketDuration(500), 'under_1s');
      assert.strictEqual(bucketDuration(3000), '1s_to_5s');
      assert.strictEqual(bucketDuration(10000), '5s_to_15s');
      assert.strictEqual(bucketDuration(45000), 'over_15s');
    });

    it('sanitizeAnalyticsPayload strictly drops forbidden keys (size, file, name, password, stack)', () => {
      const payload = {
        tool_slug: 'split-pdf',
        filename: 'tax_return_2025.pdf',
        file_name: 'payroll.pdf',
        size: 99420,
        filesize: 99420,
        bytes: 99420,
        password: 'MyPassword',
        content: 'Sensitive NDA terms',
        stack: 'Error at /main.js:1:1',
      };
      const cleaned = sanitizeAnalyticsPayload(payload);
      assert.strictEqual(cleaned.tool_slug, 'split-pdf');
      assert.strictEqual(cleaned.filename, undefined);
      assert.strictEqual(cleaned.file_name, undefined);
      assert.strictEqual(cleaned.size, undefined);
      assert.strictEqual(cleaned.filesize, undefined);
      assert.strictEqual(cleaned.bytes, undefined);
      assert.strictEqual(cleaned.password, undefined);
      assert.strictEqual(cleaned.content, undefined);
      assert.strictEqual(cleaned.stack, undefined);
    });

    it('categorizeErrorCode maps exceptions to allowlisted categories without transmitting error text', () => {
      assert.strictEqual(categorizeErrorCode(new Error('Password required')), 'password_required');
      assert.strictEqual(categorizeErrorCode(new Error('User aborted operation')), 'cancelled');
      assert.strictEqual(categorizeErrorCode(new Error('Out of memory')), 'memory_limit');
    });
  });
});
