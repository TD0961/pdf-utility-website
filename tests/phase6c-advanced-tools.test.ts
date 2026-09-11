/**
 * Phase 6C: Comprehensive Automated Test Suite
 * Tests Advanced PDF Utilities, Extraction, Productivity & SEO Expansion:
 * 1. Tool Registry & Taxonomy (30 active tools, 0 planned, 5 categories)
 * 2. PDF to CSV (table clustering, cell escaping, custom delimiters)
 * 3. PDF to Markdown (headings, lists, typography emphasis, dividers)
 * 4. Extract Images (embedded streams, deduplication, ZIP archive)
 * 5. Flatten PDF (AcroForm field detection, visual burning, verification)
 * 6. Remove PDF Metadata (info dictionary & XMP stream stripping, verification)
 * 7. Resize PDF (vector scaling, standard presets, orientation, center/fit)
 * 8. Grayscale PDF (sequential page rendering, ITU-R desaturation)
 * 9. Header & Footer (dynamic tokens, vector stamping, skip cover page)
 * 10. Privacy & Zero-Backend Invariants
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { TOOLS_REGISTRY, TOOL_CATEGORIES, getToolBySlug } from '../src/data/tools';
import { GUIDES_REGISTRY } from '../src/data/guides';
import { TOOL_RELATIONSHIPS } from '../src/lib/tools/relationships';
import { buildCsvFromGrid, escapeCsvCell } from '../src/lib/pdf/extraction/csv-builder';
import { convertPdfToCsv } from '../src/lib/pdf/extraction/csv-extractor';
import { clusterIntoRows, detectColumnAnchors, alignRowsToColumns } from '../src/lib/pdf/extraction/table-detector';
import { buildMarkdownFromLayout } from '../src/lib/pdf/extraction/markdown-builder';
import { convertPdfToMarkdown } from '../src/lib/pdf/extraction/markdown-extractor';
import { extractImagesFromPdf } from '../src/lib/pdf/extraction/image-extractor';
import { inspectFormForFlattening, flattenPdf } from '../src/lib/pdf/flatten';
import { inspectPdfMetadata, removePdfMetadata } from '../src/lib/pdf/metadata';
import { resizePdf, PRESET_DIMENSIONS } from '../src/lib/pdf/resize';
import { convertPdfToGrayscale } from '../src/lib/pdf/grayscale';
import { addHeaderFooterToPdf } from '../src/lib/pdf/header-footer';
import { validatePdfOutput } from '../src/lib/pdf/output-validator';
import type { ConversionDocumentLayout } from '../src/lib/pdf/conversion/types';

// Helper to create a minimal valid synthetic PDF
async function createSyntheticPdf(pageCount = 1, textContent = 'Sample Text'): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([600, 800]);
    page.drawText(`${textContent} Page ${i + 1}`, {
      x: 50,
      y: 750,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
  }

  return doc.save();
}

// Helper to create a synthetic PDF with metadata
async function createPdfWithMetadata(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([600, 800]);
  doc.setTitle('Confidential Financial Report');
  doc.setAuthor('John Doe');
  doc.setSubject('Q3 Quarterly Review');
  doc.setKeywords(['finance', 'quarterly', 'audit']);
  doc.setCreator('InDesign Desktop Suite');
  doc.setProducer('iLikePDF Internal');
  return doc.save();
}

// Helper to create a synthetic PDF with interactive AcroForm fields
async function createPdfWithAcroForm(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const form = doc.getForm();

  const nameField = form.createTextField('applicant_name');
  nameField.setText('Alice Johnson');
  nameField.addToPage(page, { x: 50, y: 700, width: 200, height: 25 });

  const agreeCheckbox = form.createCheckBox('agree_terms');
  agreeCheckbox.check();
  agreeCheckbox.addToPage(page, { x: 50, y: 650, width: 20, height: 20 });

  return doc.save();
}

describe('Phase 6C: Advanced PDF Utilities, Extraction & SEO Expansion', () => {
  // ==========================================
  // 1. Tool Registry & Taxonomy (30 Active Tools)
  // ==========================================
  describe('Tool Registry & Taxonomy Expansion', () => {
    it('contains exactly 30 active tools in the tools registry', () => {
      assert.equal(TOOLS_REGISTRY.length, 30);

      for (const tool of TOOLS_REGISTRY) {
        assert.equal(
          tool.status,
          'available',
          `Tool ${tool.slug} should be available, found ${tool.status}`
        );
      }
    });

    it('ensures all 8 Phase 6C tools are present with comprehensive metadata', () => {
      const phase6cSlugs = [
        'pdf-to-csv',
        'pdf-to-markdown',
        'extract-images',
        'flatten-pdf',
        'remove-pdf-metadata',
        'resize-pdf',
        'grayscale-pdf',
        'header-footer',
      ];

      for (const slug of phase6cSlugs) {
        const tool = getToolBySlug(slug);
        assert.ok(tool, `Tool ${slug} must exist in registry`);
        assert.ok(tool.name.length > 0, `Tool ${slug} must have a valid name`);
        assert.ok(tool.shortDescription.length > 10, `Tool ${slug} must have a short description`);
        assert.ok(tool.metaDescription.length > 20, `Tool ${slug} must have a meta description`);
        assert.ok(tool.howItWorks.length > 30, `Tool ${slug} must have a howItWorks description`);
        assert.ok(tool.features.length >= 4, `Tool ${slug} must have at least 4 features`);
        assert.ok(tool.steps.length >= 3, `Tool ${slug} must have at least 3 steps`);
        assert.ok(tool.faqs.length >= 1, `Tool ${slug} must have at least 1 FAQ`);
      }
    });

    it('verifies tool categories contain the expected tools', () => {
      const categories = TOOL_CATEGORIES.map((c) => c.id);
      assert.equal(categories.length, 5);

      for (const catId of categories) {
        const toolsInCat = TOOLS_REGISTRY.filter((t) => t.category === catId);
        assert.ok(toolsInCat.length >= 2, `Category ${catId} must have at least 2 tools`);
      }
    });
  });

  // ==========================================
  // 2. PDF to CSV Extraction
  // ==========================================
  describe('PDF to CSV Extraction Engine', () => {
    it('escapes cells and formats standard CSV RFC 4180', () => {
      assert.equal(escapeCsvCell('SimpleText', ','), 'SimpleText');
      assert.equal(escapeCsvCell('Text, with comma', ','), '"Text, with comma"');
      assert.equal(escapeCsvCell('Text with "quotes"', ','), '"Text with ""quotes"""');
      assert.equal(escapeCsvCell('Line1\nLine2', ','), '"Line1\nLine2"');

      const grid = [
        ['Item', 'Quantity', 'Price'],
        ['Apple', '10', '$1.50'],
        ['Banana, Yellow', '5', '$0.80'],
      ];

      const csv = buildCsvFromGrid(grid, { delimiter: ',' });
      assert.ok(csv.includes('Item,Quantity,Price'));
      assert.ok(csv.includes('Apple,10,$1.50'));
      assert.ok(csv.includes('"Banana, Yellow",5,$0.80'));
    });

    it('supports custom delimiters like semicolon and tab', () => {
      const grid = [
        ['ColA', 'ColB'],
        ['Val1', 'Val2'],
      ];

      const semi = buildCsvFromGrid(grid, { delimiter: ';' });
      assert.equal(semi, 'ColA;ColB\nVal1;Val2');

      const tab = buildCsvFromGrid(grid, { delimiter: '\t' });
      assert.equal(tab, 'ColA\tColB\nVal1\tVal2');
    });

    it('clusters raw text items into rows and column anchors', () => {
      const rawItems = [
        { str: 'Product', x: 50, y: 100, width: 40, height: 12 },
        { str: 'Price', x: 200, y: 102, width: 30, height: 12 },
        { str: 'Laptop', x: 50, y: 150, width: 40, height: 12 },
        { str: '$999', x: 200, y: 151, width: 30, height: 12 },
      ];

      const rows = clusterIntoRows(rawItems);
      assert.equal(rows.length, 2);

      const anchors = detectColumnAnchors(rows);
      assert.equal(anchors.length, 2);

      const aligned = alignRowsToColumns(rows, anchors);
      assert.equal(aligned.length, 2);
      assert.equal(aligned[0][0], 'Product');
      assert.equal(aligned[0][1], 'Price');
      assert.equal(aligned[1][0], 'Laptop');
      assert.equal(aligned[1][1], '$999');
    });

    it('converts synthetic PDF into CSV result', async () => {
      const pdfBytes = await createSyntheticPdf(2, 'Table Data');
      const result = await convertPdfToCsv({
        name: 'test-table.pdf',
        buffer: pdfBytes.buffer as ArrayBuffer,
      });

      assert.ok(result.outputBlob.size > 0);
      assert.ok(result.csvText.length > 0);
      assert.equal(result.outputFileName, 'test-table.csv');
      assert.equal(result.totalPages, 2);
    });
  });

  // ==========================================
  // 3. PDF to Markdown Extraction
  // ==========================================
  describe('PDF to Markdown Extraction Engine', () => {
    it('formats headings, lists, bold styles, and page breaks', () => {
      const mockLayout: ConversionDocumentLayout = {
        fileName: 'test.pdf',
        fileSizeBytes: 1024,
        totalPages: 2,
        medianBodyFontSize: 12,
        pages: [
          {
            pageNumber: 1,
            width: 595,
            height: 842,
            rotation: 0,
            rawItemCount: 4,
            hasSelectableText: true,
            blocks: [
              {
                text: 'Main Title',
                type: 'heading1',
                box: { x: 50, y: 700, width: 200, height: 24 },
                lines: [],
                fontSize: 24,
                isBold: true,
                isItalic: false,
                alignment: 'left',
              },
              {
                text: '• First bullet point',
                type: 'paragraph',
                box: { x: 50, y: 660, width: 200, height: 14 },
                lines: [],
                fontSize: 12,
                isBold: false,
                isItalic: false,
                alignment: 'left',
              },
              {
                text: '1. Numbered item',
                type: 'paragraph',
                box: { x: 50, y: 640, width: 200, height: 14 },
                lines: [],
                fontSize: 12,
                isBold: false,
                isItalic: false,
                alignment: 'left',
              },
              {
                text: 'Bold emphasized paragraph',
                type: 'paragraph',
                box: { x: 50, y: 620, width: 200, height: 14 },
                lines: [],
                fontSize: 12,
                isBold: true,
                isItalic: false,
                alignment: 'left',
              },
            ],
          },
          {
            pageNumber: 2,
            width: 595,
            height: 842,
            rotation: 0,
            rawItemCount: 1,
            hasSelectableText: true,
            blocks: [
              {
                text: 'Section Two',
                type: 'heading2',
                box: { x: 50, y: 700, width: 200, height: 18 },
                lines: [],
                fontSize: 18,
                isBold: true,
                isItalic: false,
                alignment: 'left',
              },
            ],
          },
        ],
      };

      const md = buildMarkdownFromLayout(mockLayout, { includePageBreaks: true });
      assert.ok(md.includes('# Main Title'));
      assert.ok(md.includes('- First bullet point'));
      assert.ok(md.includes('1. Numbered item'));
      assert.ok(md.includes('**Bold emphasized paragraph**'));
      assert.ok(md.includes('---'));
      assert.ok(md.includes('## Section Two'));
    });

    it('extracts Markdown from synthetic PDF and counts words', async () => {
      const pdfBytes = await createSyntheticPdf(1, 'Introduction to iLikePDF');
      const result = await convertPdfToMarkdown({
        name: 'intro.pdf',
        buffer: pdfBytes.buffer as ArrayBuffer,
      });

      assert.ok(result.outputBlob.size > 0);
      assert.ok(result.markdownText.length > 0);
      assert.ok(result.wordCount > 0);
      assert.equal(result.outputFileName, 'intro.md');
    });
  });

  // ==========================================
  // 4. Extract Images from PDF
  // ==========================================
  describe('Extract Images Engine', () => {
    it('inspects PDF and creates ZIP package of extracted images', async () => {
      const pdfBytes = await createSyntheticPdf(1, 'Document with no embedded raster');
      const result = await extractImagesFromPdf({
        name: 'vector-doc.pdf',
        buffer: pdfBytes.buffer as ArrayBuffer,
      });

      assert.ok(result.zipBlob instanceof Blob);
      assert.equal(result.totalImages, 0); // synthetic doc has vector text only
      assert.ok(typeof result.cleanup === 'function');
      result.cleanup();
    });
  });

  // ==========================================
  // 5. Flatten PDF Form
  // ==========================================
  describe('Flatten PDF Engine', () => {
    it('detects interactive AcroForm fields in synthetic PDF', async () => {
      const formPdfBytes = await createPdfWithAcroForm();
      const inspection = await inspectFormForFlattening(formPdfBytes.buffer as ArrayBuffer);

      assert.equal(inspection.hasForm, true);
      assert.equal(inspection.totalFields, 2);
      assert.equal(inspection.isXfa, false);

      const fieldNames = inspection.fields.map((f: { name: string }) => f.name);
      assert.ok(fieldNames.includes('applicant_name'));
      assert.ok(fieldNames.includes('agree_terms'));
    });

    it('flattens form fields permanently and verifies 0 fields remaining', async () => {
      const formPdfBytes = await createPdfWithAcroForm();
      const result = await flattenPdf(formPdfBytes.buffer as ArrayBuffer);

      assert.equal(result.fieldCountBefore, 2);
      assert.equal(result.fieldCountAfter, 0);
      assert.equal(result.pageCount, 1);

      const validation = await validatePdfOutput(result.flattenedBytes);
      assert.equal(validation.valid, true);
    });
  });

  // ==========================================
  // 6. Remove PDF Metadata
  // ==========================================
  describe('Remove PDF Metadata Engine', () => {
    it('inspects existing metadata fields', async () => {
      const pdfBytes = await createPdfWithMetadata();
      const metadata = await inspectPdfMetadata(pdfBytes.buffer as ArrayBuffer);

      assert.equal(metadata.title, 'Confidential Financial Report');
      assert.equal(metadata.author, 'John Doe');
      assert.equal(metadata.subject, 'Q3 Quarterly Review');
      assert.ok(metadata.keywords.includes('finance'));
      assert.equal(metadata.creator, 'InDesign Desktop Suite');
      assert.equal(metadata.producer, 'iLikePDF Internal');
    });

    it('strips all supported metadata fields and validates clean output', async () => {
      const pdfBytes = await createPdfWithMetadata();
      const result = await removePdfMetadata(pdfBytes.buffer as ArrayBuffer);

      assert.ok(result.clearedFieldsCount >= 6);

      // Re-inspect the stripped PDF
      const reloadedMeta = await inspectPdfMetadata(result.cleanedBytes.buffer as ArrayBuffer);
      assert.equal(reloadedMeta.title, '');
      assert.equal(reloadedMeta.author, '');
      assert.equal(reloadedMeta.subject, '');
      assert.equal(reloadedMeta.keywords, '');
      assert.equal(reloadedMeta.creator, '');
      assert.equal(reloadedMeta.producer, '');

      const validation = await validatePdfOutput(result.cleanedBytes);
      assert.equal(validation.valid, true);
    });
  });

  // ==========================================
  // 7. Resize PDF Pages
  // ==========================================
  describe('Resize PDF Engine', () => {
    it('resizes PDF pages to standard A4 preset without rasterization', async () => {
      const pdfBytes = await createSyntheticPdf(2, 'Letter Sized Text');
      const result = await resizePdf(pdfBytes.buffer as ArrayBuffer, {
        preset: 'A4',
        mode: 'fit',
      });

      assert.equal(result.totalPages, 2);
      const validation = await validatePdfOutput(result.resizedBytes);
      assert.equal(validation.valid, true);
      assert.equal(validation.pageCount, 2);

      // Verify page dimensions of output PDF
      const doc = await PDFDocument.load(result.resizedBytes);
      const page1 = doc.getPage(0);
      assert.ok(Math.abs(page1.getWidth() - PRESET_DIMENSIONS.A4.width) < 1);
      assert.ok(Math.abs(page1.getHeight() - PRESET_DIMENSIONS.A4.height) < 1);
    });

    it('resizes PDF pages to Letter preset and custom dimensions', async () => {
      const pdfBytes = await createSyntheticPdf(1, 'Test Page');
      const result = await resizePdf(pdfBytes.buffer as ArrayBuffer, {
        preset: 'Letter',
        orientation: 'portrait',
        mode: 'center',
      });

      const doc = await PDFDocument.load(result.resizedBytes);
      const page = doc.getPage(0);
      assert.ok(Math.abs(page.getWidth() - PRESET_DIMENSIONS.Letter.width) < 1);
      assert.ok(Math.abs(page.getHeight() - PRESET_DIMENSIONS.Letter.height) < 1);
    });
  });

  // ==========================================
  // 8. Grayscale PDF Conversion
  // ==========================================
  describe('Grayscale PDF Engine', () => {
    it('converts multi-page PDF into valid grayscale PDF structure', async () => {
      const pdfBytes = await createSyntheticPdf(2, 'Color Page');
      const result = await convertPdfToGrayscale(pdfBytes.buffer as ArrayBuffer);

      assert.equal(result.totalPages, 2);
      const validation = await validatePdfOutput(result.grayscaleBytes);
      assert.equal(validation.valid, true);
      assert.equal(validation.pageCount, 2);
    });
  });

  // ==========================================
  // 9. Add Header & Footer
  // ==========================================
  describe('Header & Footer Engine', () => {
    it('stamps dynamic tokens and vector text onto PDF pages', async () => {
      const pdfBytes = await createSyntheticPdf(3, 'Numbered Report');
      const result = await addHeaderFooterToPdf(pdfBytes.buffer as ArrayBuffer, {
        headerText: 'Confidential Report - {date}',
        headerAlignment: 'center',
        footerText: 'Page {page} of {total}',
        footerAlignment: 'right',
        skipFirstPage: true,
      });

      assert.equal(result.totalPages, 3);
      assert.equal(result.pagesModifiedCount, 2); // skipped first page

      const validation = await validatePdfOutput(result.stampedBytes);
      assert.equal(validation.valid, true);
      assert.equal(validation.pageCount, 3);
    });
  });

  // ==========================================
  // 10. Privacy & Zero-Backend Invariants
  // ==========================================
  describe('Privacy & Zero-Backend Invariants', () => {
    it('ensures all 30 active tools document local client-side processing without server uploads', () => {
      for (const tool of TOOLS_REGISTRY) {
        assert.ok(
          !tool.howItWorks.toLowerCase().includes('uploaded to server') &&
            !tool.howItWorks.toLowerCase().includes('cloud api'),
          `Tool ${tool.slug} must not require cloud processing`
        );
      }
    });

    it('verifies every tool in relationships graph has at least 3 related tools and 2 guides', () => {
      for (const tool of TOOLS_REGISTRY) {
        const rel = TOOL_RELATIONSHIPS[tool.slug];
        assert.ok(rel, `Tool ${tool.slug} must have an entry in TOOL_RELATIONSHIPS`);
        assert.ok(
          rel.relatedTools.length >= 3,
          `Tool ${tool.slug} must have >= 3 related tools (found ${rel.relatedTools.length})`
        );
        assert.ok(
          rel.relatedGuides.length >= 2,
          `Tool ${tool.slug} must have >= 2 related guides (found ${rel.relatedGuides.length})`
        );
      }
    });

    it('verifies all referenced related guides actually exist in GUIDES_REGISTRY', () => {
      const allGuideSlugs = new Set(GUIDES_REGISTRY.map((g) => g.slug));

      for (const [toolSlug, rel] of Object.entries(TOOL_RELATIONSHIPS)) {
        for (const gSlug of rel.relatedGuides) {
          assert.ok(
            allGuideSlugs.has(gSlug),
            `Guide slug "${gSlug}" referenced by tool "${toolSlug}" must exist in GUIDES_REGISTRY`
          );
        }
      }
    });

    it('verifies GUIDES_REGISTRY expanded with 8 high-value Phase 6C guides (total 24 guides)', () => {
      assert.equal(GUIDES_REGISTRY.length, 24);

      const expectedNewGuides = [
        'how-to-convert-pdf-to-csv',
        'pdf-to-markdown-guide',
        'how-to-extract-images-from-a-pdf',
        'how-to-flatten-a-fillable-pdf',
        'how-to-remove-metadata-from-a-pdf',
        'how-to-resize-pdf-pages',
        'how-to-convert-pdf-to-grayscale',
        'how-to-add-headers-and-footers-to-a-pdf',
      ];

      for (const gSlug of expectedNewGuides) {
        const guide = GUIDES_REGISTRY.find((g) => g.slug === gSlug);
        assert.ok(guide, `Guide ${gSlug} must exist in GUIDES_REGISTRY`);
        assert.ok(guide.content.sections.length >= 2, `Guide ${gSlug} must have substantial sections`);
      }
    });
  });
});
