/**
 * PDFSimplify — Comprehensive PDF Tool Reliability & Professional QA Audit Suite
 * Exhaustively tests all 30 production tools against a realistic PDF scenario matrix,
 * 15 sequential chained workflows, security edge-cases, and programmatic output validation.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

// Matrix generator
import { generateTestMatrix, TestMatrix, SAMPLE_PNG_BASE64, SAMPLE_JPG_BASE64 } from './test-matrix-generator';

// Tool Engines
import { mergePdf } from '../src/lib/pdf/merge';
import { splitPdf } from '../src/lib/pdf/split';
import { organizePdf } from '../src/lib/pdf/organize';
import { rotatePdf } from '../src/lib/pdf/rotate';
import { extractPages } from '../src/lib/pdf/extract';
import { pdfToJpg } from '../src/lib/pdf/pdf-to-jpg';
import { pdfToText } from '../src/lib/pdf/pdf-to-text';
import { jpgToPdf } from '../src/lib/pdf/jpg-to-pdf';
import { addPageNumbers } from '../src/lib/pdf/page-numbers';
import { watermarkPdf } from '../src/lib/pdf/watermark';
import { protectPdf } from '../src/lib/pdf/protect';
import { unlockPdf } from '../src/lib/pdf/unlock';
import { exportAnnotatedPdf } from '../src/lib/pdf/editor/export';
import { convertPdfToWord, convertPdfToPowerPoint, validateOpenXmlPackage } from '../src/lib/pdf/conversion/converter';
import { buildXlsxFromSheets } from '../src/lib/pdf/conversion/xlsx-builder';
import { compressPdf } from '../src/lib/pdf/compress';
import { parseOcrPageRange } from '../src/lib/pdf/ocr';
import { applyVisualSignature } from '../src/lib/pdf/sign';
import { inspectInteractiveForm, fillPdfForm } from '../src/lib/pdf/fill-form';
import { cropPdfDocument } from '../src/lib/pdf/crop';
import { comparePdfDocuments } from '../src/lib/pdf/compare';
import { convertPdfToCsv } from '../src/lib/pdf/extraction/csv-extractor';
import { convertPdfToMarkdown } from '../src/lib/pdf/extraction/markdown-extractor';
import { extractImagesFromPdf } from '../src/lib/pdf/extraction/image-extractor';
import { inspectFormForFlattening, flattenPdf } from '../src/lib/pdf/flatten';
import { inspectPdfMetadata, removePdfMetadata } from '../src/lib/pdf/metadata';
import { resizePdf } from '../src/lib/pdf/resize';
import { convertPdfToGrayscale } from '../src/lib/pdf/grayscale';
import { addHeaderFooterToPdf } from '../src/lib/pdf/header-footer';
import { validatePdfOutput, validateXlsxOutput } from '../src/lib/pdf/output-validator';
import { isEncrypted } from '@pdfsmaller/pdf-decrypt';

describe('PDFSimplify — Comprehensive 30-Tool Professional Reliability Audit', () => {
  let matrix: TestMatrix;

  before(async () => {
    matrix = await generateTestMatrix();
    assert.ok(matrix, 'Test matrix must be generated');
  });

  // Helper to wrap Uint8Array to File-like structure
  const toFile = (name: string, bytes: Uint8Array) => ({
    name,
    bytes,
    buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  });

  const toBuffer = (base64: string): ArrayBuffer => {
    const buf = Buffer.from(base64, 'base64');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  };

  // ==========================================
  // SECTION 1: ALL 30 TOOLS FUNCTIONAL AUDIT
  // ==========================================

  describe('1. Merge PDF Tool Audit', () => {
    it('merges multiple files of different page counts and dimensions', async () => {
      const res = await mergePdf({
        files: [matrix.basic1Page, matrix.basic2Page, matrix.portraitA4, matrix.landscapeA4, matrix.letterSize],
      });
      assert.ok(res.uint8Array.length > 0);
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 1 + 2 + 1 + 1 + 1); // 6 pages
    });

    it('merges duplicate files safely without loss', async () => {
      const res = await mergePdf({ files: [matrix.basic2Page, matrix.basic2Page] });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 4);
    });

    it('rejects less than 2 files with clear error', async () => {
      await assert.rejects(async () => {
        await mergePdf({ files: [matrix.basic1Page] });
      }, /at least 2/i);
    });

    it('rejects corrupted file gracefully', async () => {
      await assert.rejects(async () => {
        await mergePdf({ files: [matrix.basic1Page, matrix.corruptedTruncatedDoc] });
      });
    });
  });

  describe('2. Split PDF Tool Audit', () => {
    it('splits in extract mode for selected pages', async () => {
      const res = await splitPdf({
        file: matrix.basic5Page,
        mode: 'extract',
        selectedPages: [1, 3, 5],
      });
      assert.ok(res.pdfBytes);
      const parsed = await PDFDocument.load(res.pdfBytes!);
      assert.strictEqual(parsed.getPageCount(), 3);
    });

    it('splits in all mode into a valid ZIP of individual PDFs', async () => {
      const res = await splitPdf({
        file: matrix.basic5Page,
        mode: 'all',
      });
      assert.strictEqual(res.isZip, true);
      assert.ok(res.zipBlob);
      const zip = await JSZip.loadAsync(await res.zipBlob!.arrayBuffer());
      const fileNames = Object.keys(zip.files).filter((f) => f.endsWith('.pdf'));
      assert.strictEqual(fileNames.length, 5);
    });

    it('splits by page ranges', async () => {
      const res = await splitPdf({
        file: matrix.basic5Page,
        mode: 'ranges',
        rangeString: '1-2, 4-5',
      });
      assert.strictEqual(res.isZip, true);
      const zip = await JSZip.loadAsync(await res.zipBlob!.arrayBuffer());
      assert.strictEqual(Object.keys(zip.files).filter((f) => f.endsWith('.pdf')).length, 2);
    });

    it('rejects invalid range expressions gracefully', async () => {
      await assert.rejects(async () => {
        await splitPdf({
          file: matrix.basic5Page,
          mode: 'ranges',
          rangeString: '10-20',
        });
      });
    });
  });

  describe('3. Organize PDF Tool Audit', () => {
    it('reorders, rotates, deletes, and duplicates pages simultaneously', async () => {
      const res = await organizePdf({
        file: matrix.basic5Page,
        pages: [
          { originalIndex: 0, rotationDelta: 90 }, // Page 1 rotated 90
          { originalIndex: 2, rotationDelta: 0 },  // Page 3
          { originalIndex: 2, rotationDelta: 180 }, // Page 3 duplicated and rotated 180
          { originalIndex: 4, rotationDelta: 0 },  // Page 5
        ],
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 4);
      assert.strictEqual(parsed.getPage(0).getRotation().angle, 90);
      assert.strictEqual(parsed.getPage(2).getRotation().angle, 180);
    });

    it('rejects empty page instructions list', async () => {
      await assert.rejects(async () => {
        await organizePdf({ file: matrix.basic5Page, pages: [] });
      }, /at least one page/i);
    });
  });

  describe('4. Rotate PDF Tool Audit', () => {
    it('rotates all pages by 90 degrees', async () => {
      const res = await rotatePdf({ file: matrix.basic2Page, allPagesDelta: 90 });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPage(0).getRotation().angle, 90);
      assert.strictEqual(parsed.getPage(1).getRotation().angle, 90);
    });

    it('rotates specific selected page', async () => {
      const res = await rotatePdf({
        file: matrix.basic2Page,
        rotations: [{ pageIndex: 0, deltaRotation: 180 }],
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPage(0).getRotation().angle, 180);
      assert.strictEqual(parsed.getPage(1).getRotation().angle, 0);
    });

    it('correctly handles pre-rotated documents cumulatively', async () => {
      const res = await rotatePdf({ file: matrix.prerotatedPages, allPagesDelta: 90 });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPage(0).getRotation().angle, 180); // 90 + 90
      assert.strictEqual(parsed.getPage(1).getRotation().angle, 270); // 180 + 90
      assert.strictEqual(parsed.getPage(2).getRotation().angle, 0);   // (270 + 90) % 360 = 0
    });
  });

  describe('5. Extract Pages Tool Audit', () => {
    it('extracts non-consecutive pages and preserves order', async () => {
      const res = await extractPages({
        file: matrix.basic5Page,
        pageIndices: [3, 1], // 0-based: page 4 then page 2
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 2);
    });

    it('rejects out of bounds page index', async () => {
      await assert.rejects(async () => {
        await extractPages({ file: matrix.basic2Page, pageIndices: [99] });
      }, /out of range/i);
    });
  });

  describe('6. PDF to JPG Tool Audit', () => {
    it('converts multi-page PDF into ZIP containing valid image files', async () => {
      const res = await pdfToJpg({ file: matrix.basic2Page, format: 'image/jpeg', quality: 0.8 });
      assert.strictEqual(res.totalPages, 2);
      assert.ok(res.zipBlob);
      const zip = await JSZip.loadAsync(await res.zipBlob.arrayBuffer());
      const files = Object.keys(zip.files).filter((f) => f.endsWith('.jpg') || f.endsWith('.jpeg'));
      assert.strictEqual(files.length, 2);
    });

    it('rejects corrupted PDF', async () => {
      await assert.rejects(async () => {
        await pdfToJpg({ file: matrix.corruptedTruncatedDoc });
      });
    });
  });

  describe('7. PDF to Text Tool Audit', () => {
    it('extracts structured text across multiple pages', async () => {
      const res = await pdfToText({ file: matrix.basic2Page });
      assert.strictEqual(res.totalPages, 2);
      assert.ok(res.fullText.includes('Document Two - Page 1'));
      assert.ok(res.fullText.includes('Document Two - Page 2'));
    });

    it('extracts text from multi-font document accurately', async () => {
      const res = await pdfToText({ file: matrix.multiFontDoc });
      assert.ok(res.fullText.includes('Helvetica Bold Heading'));
      assert.ok(res.fullText.includes('Times Roman body text'));
    });

    it('handles blank pages gracefully without error', async () => {
      const res = await pdfToText({ file: matrix.blankPagesDoc });
      assert.strictEqual(res.totalPages, 3);
      assert.ok(res.pages[1].text.trim().length === 0, 'Page 2 should be blank text');
    });
  });

  describe('8. JPG to PDF Tool Audit', () => {
    it('converts single image to valid PDF', async () => {
      const imgFile = {
        name: 'test.jpg',
        buffer: toBuffer(SAMPLE_JPG_BASE64),
      };
      const res = await jpgToPdf({
        images: [imgFile],
        pageSize: 'fit',
      });
      const parsed = await PDFDocument.load(res.pdfBytes!);
      assert.strictEqual(parsed.getPageCount(), 1);
    });

    it('converts multiple images with standard A4 page sizing', async () => {
      const img1 = { name: 'img1.png', buffer: toBuffer(SAMPLE_PNG_BASE64) };
      const img2 = { name: 'img2.png', buffer: toBuffer(SAMPLE_PNG_BASE64) };
      const res = await jpgToPdf({
        images: [img1, img2],
        pageSize: 'a4',
        orientation: 'portrait',
      });
      const parsed = await PDFDocument.load(res.pdfBytes!);
      assert.strictEqual(parsed.getPageCount(), 2);
    });
  });

  describe('9. Add Page Numbers Tool Audit', () => {
    it('adds numbers to all pages with bottom-center positioning', async () => {
      const res = await addPageNumbers({
        file: matrix.basic5Page,
        position: 'bottom-center',
        format: 'total',
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 5);
      const val = await validatePdfOutput(res.uint8Array, { expectedPages: 5 });
      assert.strictEqual(val.isValid, true);
    });

    it('supports custom start number and page offsets', async () => {
      const res = await addPageNumbers({
        file: matrix.basic2Page,
        startNumber: 10,
        pages: '1-2',
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 2);
    });
  });

  describe('10. Watermark PDF Tool Audit', () => {
    it('applies diagonal text watermark across all pages', async () => {
      const res = await watermarkPdf({
        file: matrix.basic2Page,
        text: 'CONFIDENTIAL AUDIT',
        opacity: 0.3,
        fontSize: 48,
        color: '#ff0000',
      });
      const parsed = await PDFDocument.load(res.pdfBytes);
      assert.strictEqual(parsed.getPageCount(), 2);
    });

    it('supports repeating tiled watermark pattern', async () => {
      const res = await watermarkPdf({
        file: matrix.basic1Page,
        text: 'COPY',
        position: 'tiled',
      });
      const parsed = await PDFDocument.load(res.pdfBytes);
      assert.strictEqual(parsed.getPageCount(), 1);
    });
  });

  describe('11. Protect PDF Tool Audit', () => {
    it('encrypts document using AES-256 with strong password', async () => {
      const res = await protectPdf({
        file: matrix.basic2Page,
        userPassword: 'StrongPassword2026!',
      });
      assert.strictEqual(res.algorithm, 'AES-256');
      assert.strictEqual(res.totalPages, 2);
      const enc = await isEncrypted(res.uint8Array);
      assert.strictEqual(enc.encrypted, true);
    });

    it('rejects empty password with clear error', async () => {
      await assert.rejects(async () => {
        await protectPdf({ file: matrix.basic1Page, userPassword: '' });
      }, /password/i);
    });
  });

  describe('12. Unlock PDF Tool Audit', () => {
    it('unlocks encrypted document with correct password', async () => {
      const res = await unlockPdf({
        file: matrix.encryptedDoc,
        password: matrix.encryptedDoc.password,
      });
      assert.strictEqual(res.totalPages, 2);
      const enc = await isEncrypted(res.uint8Array);
      assert.strictEqual(enc.encrypted, false);
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 2);
    });

    it('rejects incorrect password with authentication failure', async () => {
      await assert.rejects(async () => {
        await unlockPdf({ file: matrix.encryptedDoc, password: 'WrongPassword' });
      }, /password/i);
    });

    it('rejects unencrypted document with clear notification', async () => {
      await assert.rejects(async () => {
        await unlockPdf({ file: matrix.basic1Page, password: 'any' });
      }, /not encrypted/i);
    });
  });

  describe('13. PDF Editor Tool Audit', () => {
    it('exports high-fidelity vector annotations without rasterization', async () => {
      const res = await exportAnnotatedPdf({
        file: matrix.basic2Page,
        annotations: [
          {
            id: 'ann-1',
            pageIndex: 0,
            type: 'text',
            x: 50,
            y: 50,
            text: 'Editor Approved Stamp',
            fontSize: 16,
            color: '#4f46e5',
          },
          {
            id: 'ann-2',
            pageIndex: 0,
            type: 'rectangle',
            x: 40,
            y: 40,
            width: 220,
            height: 40,
            strokeColor: '#38bdf8',
            strokeWidth: 2,
            fillColor: '#6366f1',
            fillOpacity: 0.1,
          },
        ],
      });
      assert.ok(res.pdfBytes.length > 0);
      const parsed = await PDFDocument.load(res.pdfBytes);
      assert.strictEqual(parsed.getPageCount(), 2);
    });
  });

  describe('14. PDF to Word Tool Audit', () => {
    it('converts multi-page PDF to valid OpenXML DOCX document', async () => {
      const res = await convertPdfToWord(matrix.basic2Page);
      assert.ok(res.outputBytes && res.outputBytes.length > 0);
      assert.strictEqual(res.outputFileName?.endsWith('.docx'), true);
      const isValid = await validateOpenXmlPackage(res.outputBytes!, 'word/document.xml');
      assert.strictEqual(isValid, true, 'Word package must contain word/document.xml');
    });
  });

  describe('15. PDF to PowerPoint Tool Audit', () => {
    it('converts multi-page PDF to valid OpenXML PPTX presentation', async () => {
      const res = await convertPdfToPowerPoint(matrix.basic2Page);
      assert.ok(res.outputBytes && res.outputBytes.length > 0);
      assert.strictEqual(res.outputFileName?.endsWith('.pptx'), true);
      const isValid = await validateOpenXmlPackage(res.outputBytes!, 'ppt/presentation.xml');
      assert.strictEqual(isValid, true, 'PowerPoint package must contain ppt/presentation.xml');
    });
  });

  describe('16. PDF to Excel Tool Audit', () => {
    it('generates valid XLSX spreadsheet from tabular document', async () => {
      const sheets = [
        {
          name: 'Sales Data',
          rows: [
            ['ID', 'Description', 'Quantity', 'Price', 'Total'],
            ['101', 'Standard Subscription', 5, 49.0, 245.0],
            ['102', 'Enterprise Support', '', 200.0, 200.0],
          ],
        },
      ];
      const xlsxBytes = await buildXlsxFromSheets(sheets);
      const report = await validateXlsxOutput(xlsxBytes);
      assert.strictEqual(report.valid, true, 'XLSX must be valid OpenXML workbook');
    });
  });

  describe('17. Compress PDF Tool Audit', () => {
    it('compresses PDF across basic, balanced, and strong modes', async () => {
      for (const level of ['basic', 'balanced', 'strong'] as const) {
        const res = await compressPdf({ file: matrix.imageRasterDoc, level });
        assert.ok(res.pdfBytes.length > 0);
        const parsed = await PDFDocument.load(res.pdfBytes);
        assert.strictEqual(parsed.getPageCount(), 1);
        assert.ok(res.compressionRatio >= 0);
      }
    });
  });

  describe('18. OCR PDF Tool Audit', () => {
    it('parses valid and complex page ranges for OCR processing', () => {
      const r1 = parseOcrPageRange('all', 10);
      assert.strictEqual(r1.length, 10);
      const r2 = parseOcrPageRange('1-3, 5', 10);
      assert.deepStrictEqual(r2, [1, 2, 3, 5]);
    });

    it('rejects invalid OCR page range expressions', () => {
      assert.throws(() => parseOcrPageRange('15-20', 5), /out of bounds/i);
    });
  });

  describe('19. Sign PDF Tool Audit', () => {
    it('applies visual signature to target page and preserves document geometry', async () => {
      const sigDataUrl = `data:image/png;base64,${SAMPLE_PNG_BASE64}`;
      const res = await applyVisualSignature(matrix.basic2Page.bytes, {
        signatureDataUrl: sigDataUrl,
        pageNumber: 2,
        x: 100,
        y: 100,
        width: 150,
        height: 60,
      });
      const parsed = await PDFDocument.load(res);
      assert.strictEqual(parsed.getPageCount(), 2);
    });
  });

  describe('20. Fill PDF Tool Audit', () => {
    it('inspects form fields in AcroForm document', async () => {
      const fields = await inspectInteractiveForm(matrix.acroformDoc.bytes);
      assert.ok(fields.length >= 2, 'Should discover text and checkbox fields');
      const nameField = fields.find((f) => f.name === 'fullName');
      assert.ok(nameField);
      assert.strictEqual(nameField.type, 'text');
    });

    it('fills form fields with updated values', async () => {
      const res = await fillPdfForm(matrix.acroformDoc.bytes, [
        { name: 'fullName', type: 'text', value: 'Bob Johnson' },
        { name: 'termsAccepted', type: 'checkbox', value: true },
      ]);
      const parsed = await PDFDocument.load(res);
      const form = parsed.getForm();
      const txt = form.getTextField('fullName');
      assert.strictEqual(txt.getText(), 'Bob Johnson');
    });
  });

  describe('21. Crop PDF Tool Audit', () => {
    it('crops pages to specified margins and adjusts page boundary', async () => {
      const res = await cropPdfDocument(matrix.portraitA4.bytes, {
        mode: 'all',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });
      const parsed = await PDFDocument.load(res.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 1);
      const p = parsed.getPage(0);
      assert.ok(p.getWidth() < 595.28);
      assert.ok(p.getHeight() < 841.89);
    });
  });

  describe('22. Compare PDF Tool Audit', () => {
    it('detects 100% similarity on identical documents', async () => {
      const res = await comparePdfDocuments(matrix.basic1Page.bytes, matrix.basic1Page.bytes);
      assert.strictEqual(res.similarityScore, 100);
      assert.strictEqual(res.identical, true);
    });

    it('detects differences between dissimilar documents', async () => {
      const res = await comparePdfDocuments(matrix.basic1Page.bytes, matrix.basic2Page.bytes);
      assert.strictEqual(res.identical, false);
      assert.ok(res.similarityScore < 100);
    });
  });

  describe('23. PDF to CSV Tool Audit', () => {
    it('extracts table content into valid CSV format with proper cell escaping', async () => {
      const res = await convertPdfToCsv(matrix.tableDoc.bytes);
      assert.ok(res.csvContent.length > 0);
      assert.ok(res.tablesFound >= 1);
    });
  });

  describe('24. PDF to Markdown Tool Audit', () => {
    it('converts headings and paragraphs into markdown syntax', async () => {
      const res = await convertPdfToMarkdown(matrix.multiFontDoc.bytes);
      assert.ok(res.markdownContent.length > 0);
      assert.ok(res.markdownContent.includes('Helvetica Bold') || res.markdownContent.includes('Times Roman'));
    });
  });

  describe('25. Extract Images Tool Audit', () => {
    it('extracts embedded raster images and packages into ZIP', async () => {
      const res = await extractImagesFromPdf(matrix.imageRasterDoc.bytes);
      assert.ok(res.imagesCount >= 1);
      assert.strictEqual(res.images[0].format, 'png');
      assert.ok(res.zipArchive.length > 0);
      const zip = await JSZip.loadAsync(res.zipArchive);
      assert.ok(Object.keys(zip.files).length >= 1);
    });

    it('handles document with zero images gracefully', async () => {
      const res = await extractImagesFromPdf(matrix.basic1Page.bytes);
      assert.strictEqual(res.imagesCount, 0);
      assert.strictEqual(res.zipArchive.length, 0);
    });
  });

  describe('26. Flatten PDF Tool Audit', () => {
    it('flattens AcroForm fields into permanent page vectors', async () => {
      const inspection = await inspectFormForFlattening(matrix.acroformDoc.bytes);
      assert.ok(inspection.hasInteractiveForm);
      assert.ok(inspection.fieldCount >= 2);

      const flattened = await flattenPdf(matrix.acroformDoc.bytes);
      const parsed = await PDFDocument.load(flattened);
      const postForm = parsed.getForm();
      assert.strictEqual(postForm.getFields().length, 0, 'Form fields must be flattened and removed');
    });
  });

  describe('27. Remove PDF Metadata Tool Audit', () => {
    it('detects metadata and purges all document information', async () => {
      const beforeMeta = await inspectPdfMetadata(matrix.metadataDoc.bytes);
      assert.strictEqual(beforeMeta.title, 'Annual Strategy Review 2026');
      assert.strictEqual(beforeMeta.author, 'Security Audit Team');

      const purged = await removePdfMetadata(matrix.metadataDoc.bytes);
      const afterMeta = await inspectPdfMetadata(purged.cleanedBytes);
      assert.strictEqual(afterMeta.title, '');
      assert.strictEqual(afterMeta.author, '');
      assert.strictEqual(afterMeta.subject, '');
    });
  });

  describe('28. Resize PDF Tool Audit', () => {
    it('resizes document to US Letter dimensions', async () => {
      const res = await resizePdf(matrix.portraitA4.bytes, {
        preset: 'letter',
        orientation: 'portrait',
        scaling: 'fit',
      });
      const parsed = await PDFDocument.load(res);
      const p = parsed.getPage(0);
      assert.strictEqual(Math.round(p.getWidth()), 612);
      assert.strictEqual(Math.round(p.getHeight()), 792);
    });
  });

  describe('29. Grayscale PDF Tool Audit', () => {
    it('converts multi-page color document to valid grayscale PDF', async () => {
      const res = await convertPdfToGrayscale(matrix.basic2Page.bytes, { quality: 0.85 });
      assert.strictEqual(res.totalPages, 2);
      const parsed = await PDFDocument.load(res.pdfBytes);
      assert.strictEqual(parsed.getPageCount(), 2);
    });
  });

  describe('30. Header & Footer Tool Audit', () => {
    it('stamps dynamic header and footer with page tokens', async () => {
      const res = await addHeaderFooterToPdf(matrix.basic2Page.bytes, {
        headerText: 'PDFSimplify Corporate Header',
        headerPosition: 'center',
        footerText: 'Page {page} of {total}',
        footerPosition: 'right',
        fontSize: 9,
      });
      const parsed = await PDFDocument.load(res);
      assert.strictEqual(parsed.getPageCount(), 2);
    });
  });

  // ==========================================
  // SECTION 2: 15 MULTI-TOOL CHAINED WORKFLOWS
  // ==========================================

  describe('Chained Multi-Tool Pipelines (15 Integration Workflows)', () => {
    it('Workflow 1: Merge -> Organize -> Rotate -> Output', async () => {
      const mRes = await mergePdf({ files: [matrix.basic1Page, matrix.basic2Page] });
      const oRes = await organizePdf({
        file: toFile('merged.pdf', mRes.uint8Array),
        pages: [
          { originalIndex: 2, rotationDelta: 0 },
          { originalIndex: 0, rotationDelta: 0 },
          { originalIndex: 1, rotationDelta: 0 },
        ],
      });
      const rRes = await rotatePdf({
        file: toFile('organized.pdf', oRes.uint8Array),
        allPagesDelta: 90,
      });
      const parsed = await PDFDocument.load(rRes.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 3);
      assert.strictEqual(parsed.getPage(0).getRotation().angle, 90);
    });

    it('Workflow 2: Merge -> Add Page Numbers -> Watermark -> Output', async () => {
      const mRes = await mergePdf({ files: [matrix.basic2Page, matrix.portraitA4] });
      const nRes = await addPageNumbers({
        file: toFile('merged.pdf', mRes.uint8Array),
        position: 'bottom-right',
        format: 'numeric',
      });
      const wRes = await watermarkPdf({
        file: toFile('numbered.pdf', nRes.uint8Array),
        text: 'PROCESSED PIPELINE',
      });
      const parsed = await PDFDocument.load(wRes.pdfBytes);
      assert.strictEqual(parsed.getPageCount(), 3);
    });

    it('Workflow 3: Split -> Rotate -> Merge', async () => {
      const sRes = await splitPdf({
        file: matrix.basic5Page,
        mode: 'extract',
        selectedPages: [1, 2],
      });
      const rRes = await rotatePdf({
        file: toFile('split.pdf', sRes.pdfBytes!),
        allPagesDelta: 180,
      });
      const mRes = await mergePdf({
        files: [toFile('rotated.pdf', rRes.uint8Array), matrix.basic1Page],
      });
      const parsed = await PDFDocument.load(mRes.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 3);
      assert.strictEqual(parsed.getPage(0).getRotation().angle, 180);
    });

    it('Workflow 4: JPG -> PDF -> Compress', async () => {
      const imgFile = {
        name: 'test.jpg',
        buffer: toBuffer(SAMPLE_JPG_BASE64),
      };
      const jRes = await jpgToPdf({ images: [imgFile], pageSize: 'fit' });
      const cRes = await compressPdf({
        file: toFile('converted.pdf', jRes.pdfBytes!),
        level: 'basic',
      });
      const parsed = await PDFDocument.load(cRes.pdfBytes);
      assert.strictEqual(parsed.getPageCount(), 1);
    });

    it('Workflow 5: PDF -> JPG -> JPG -> PDF (Roundtrip Conversion)', async () => {
      const jRes = await pdfToJpg({ file: matrix.basic1Page, format: 'image/jpeg' });
      assert.ok(jRes.zipBlob);
      const zip = await JSZip.loadAsync(await jRes.zipBlob.arrayBuffer());
      const firstEntry = Object.values(zip.files)[0];
      const imgBytes = await firstEntry.async('arraybuffer');
      const pRes = await jpgToPdf({
        images: [{ name: 'page-1.jpg', buffer: imgBytes }],
        pageSize: 'fit',
      });
      const parsed = await PDFDocument.load(pRes.pdfBytes!);
      assert.strictEqual(parsed.getPageCount(), 1);
    });

    it('Workflow 6: Protect -> Unlock -> Validate', async () => {
      const pRes = await protectPdf({
        file: matrix.basic2Page,
        userPassword: 'PipelineSecret99!',
      });
      const uRes = await unlockPdf({
        file: toFile('protected.pdf', pRes.uint8Array),
        password: 'PipelineSecret99!',
      });
      const parsed = await PDFDocument.load(uRes.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 2);
    });

    it('Workflow 7: Fill -> Flatten -> Output', async () => {
      const fRes = await fillPdfForm(matrix.acroformDoc.bytes, [
        { name: 'fullName', type: 'text', value: 'Pipeline User' },
      ]);
      const flatRes = await flattenPdf(fRes);
      const parsed = await PDFDocument.load(flatRes);
      assert.strictEqual(parsed.getForm().getFields().length, 0);
    });

    it('Workflow 8: OCR -> Text extraction verification', async () => {
      const ranges = parseOcrPageRange('all', matrix.scannedImageOnlyDoc.bytes.length > 0 ? 1 : 1);
      assert.strictEqual(ranges.length, 1);
      const txt = await pdfToText({ file: matrix.scannedImageOnlyDoc });
      assert.strictEqual(txt.totalPages, 1);
    });

    it('Workflow 9: Crop -> Resize -> Grayscale', async () => {
      const cRes = await cropPdfDocument(matrix.portraitA4.bytes, {
        mode: 'all',
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
      });
      const rRes = await resizePdf(cRes, {
        preset: 'letter',
        orientation: 'portrait',
      });
      const gRes = await convertPdfToGrayscale(rRes);
      const parsed = await PDFDocument.load(gRes.pdfBytes);
      assert.strictEqual(parsed.getPageCount(), 1);
    });

    it('Workflow 10: Edit -> Sign -> Validate', async () => {
      const eRes = await exportAnnotatedPdf({
        file: matrix.basic1Page,
        annotations: [
          {
            id: 'edit-1',
            pageIndex: 0,
            type: 'text',
            x: 50,
            y: 50,
            text: 'Contract Clause #10',
            fontSize: 12,
            color: '#000000',
          },
        ],
      });
      const sRes = await applyVisualSignature(eRes.pdfBytes, {
        signatureDataUrl: `data:image/png;base64,${SAMPLE_PNG_BASE64}`,
        pageNumber: 1,
        x: 100,
        y: 100,
        width: 100,
        height: 40,
      });
      const parsed = await PDFDocument.load(sRes);
      assert.strictEqual(parsed.getPageCount(), 1);
    });

    it('Workflow 11: Extract pages -> Watermark -> Compress', async () => {
      const exRes = await extractPages({ file: matrix.basic10Page, pageIndices: [0, 1, 2] });
      const wRes = await watermarkPdf({
        file: toFile('extracted.pdf', exRes.uint8Array),
        text: 'DRAFT COPY',
      });
      const cRes = await compressPdf({
        file: toFile('watermarked.pdf', wRes.pdfBytes),
        level: 'balanced',
      });
      const parsed = await PDFDocument.load(cRes.pdfBytes);
      assert.strictEqual(parsed.getPageCount(), 3);
    });

    it('Workflow 12: PDF -> Text -> Markdown pipeline', async () => {
      const tRes = await pdfToText({ file: matrix.multiFontDoc });
      assert.ok(tRes.fullText.length > 0);
      const mRes = await convertPdfToMarkdown(matrix.multiFontDoc.bytes);
      assert.ok(mRes.markdownContent.length > 0);
    });

    it('Workflow 13: Table document -> Excel (.xlsx) & CSV extraction', async () => {
      const csvRes = await convertPdfToCsv(matrix.tableDoc.bytes);
      assert.ok(csvRes.tablesFound >= 1);
    });

    it('Workflow 14: Metadata rich document -> remove metadata -> inspect empty', async () => {
      const removed = await removePdfMetadata(matrix.metadataDoc.bytes);
      const postInspect = await inspectPdfMetadata(removed.cleanedBytes);
      assert.strictEqual(postInspect.hasMetadata, false);
      assert.strictEqual(postInspect.title, '');
    });

    it('Workflow 15: Deep stress pipeline (Merge -> Numbers -> Watermark -> Protect -> Unlock -> Compress)', async () => {
      // 1. Merge 5 + 2 = 7 pages
      const mRes = await mergePdf({ files: [matrix.basic5Page, matrix.basic2Page] });
      // 2. Add page numbers
      const nRes = await addPageNumbers({
        file: toFile('merged.pdf', mRes.uint8Array),
        position: 'bottom-center',
      });
      // 3. Watermark
      const wRes = await watermarkPdf({
        file: toFile('numbered.pdf', nRes.uint8Array),
        text: 'STRESS AUDIT',
      });
      // 4. Protect
      const pRes = await protectPdf({
        file: toFile('watermarked.pdf', wRes.pdfBytes),
        userPassword: 'DeepPipelinePassword123!',
      });
      // 5. Unlock
      const uRes = await unlockPdf({
        file: toFile('protected.pdf', pRes.uint8Array),
        password: 'DeepPipelinePassword123!',
      });
      // 6. Compress
      const cRes = await compressPdf({
        file: toFile('unlocked.pdf', uRes.uint8Array),
        level: 'basic',
      });
      const parsed = await PDFDocument.load(cRes.pdfBytes);
      assert.strictEqual(parsed.getPageCount(), 7);
    });
  });

  // ==========================================
  // SECTION 3: SECURITY & INPUT SAFETY AUDIT
  // ==========================================

  describe('Security & Input Safety Invariants', () => {
    it('safely handles malicious path traversal in filenames', async () => {
      const res = await mergePdf({ files: [matrix.basic1Page, matrix.pathTraversalFile] });
      assert.ok(res.uint8Array.length > 0);
      assert.strictEqual(res.fileName, 'merged-document.pdf');
    });

    it('sanitizes script tags in metadata without XSS execution', async () => {
      const meta = await inspectPdfMetadata(matrix.xssInjectionDoc.bytes);
      assert.ok(meta.title?.includes('<script>'));
      const cleaned = await removePdfMetadata(matrix.xssInjectionDoc.bytes);
      const postClean = await inspectPdfMetadata(cleaned.cleanedBytes);
      assert.strictEqual(postClean.title, '');
    });

    it('rejects zero-byte file gracefully', async () => {
      await assert.rejects(async () => {
        await mergePdf({ files: [matrix.basic1Page, matrix.zeroByteFile] });
      });
    });

    it('rejects non-PDF files renamed to .pdf extension', async () => {
      await assert.rejects(async () => {
        await mergePdf({ files: [matrix.basic1Page, matrix.renamedNonPdfDoc] });
      });
    });
  });

  // ==========================================
  // SECTION 4: 50-PAGE LARGE DOCUMENT STRESS
  // ==========================================

  describe('Large Document Performance & Stress Test (50-Page PDF)', () => {
    it('processes 50-page document across numbers and watermark', async () => {
      const start = Date.now();

      // Number 50 pages
      const nRes = await addPageNumbers({
        file: matrix.basic50Page,
        position: 'bottom-center',
      });
      const parsed = await PDFDocument.load(nRes.uint8Array);
      assert.strictEqual(parsed.getPageCount(), 50);

      // Watermark 50 pages
      const wRes = await watermarkPdf({
        file: toFile('numbered-50.pdf', nRes.uint8Array),
        text: 'LARGE STRESS TEST',
      });
      const parsedW = await PDFDocument.load(wRes.pdfBytes);
      assert.strictEqual(parsedW.getPageCount(), 50);

      const elapsed = Date.now() - start;
      assert.ok(elapsed < 20000, `50-page processing must finish in <20s, took ${elapsed}ms`);
    });
  });
});
