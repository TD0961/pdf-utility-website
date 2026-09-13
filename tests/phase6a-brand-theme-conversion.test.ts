import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TOOLS_REGISTRY, TOOL_CATEGORIES, getRelatedTools } from '../src/data/tools';
import { getCuratedRelationship } from '../src/lib/tools/relationships';
import {
  buildDocxFromLayout,
  buildPptxFromLayout,
  deriveOutputFilename,
  createCancellationToken,
  validateOpenXmlPackage,
  ConversionDocumentLayout,
} from '../src/lib/pdf/conversion';

describe('Phase 6A: Product Expansion, Brand UX, Theme System & Conversion Foundation', () => {
  describe('Brand Identity & Logo Audit', () => {
    it('ensures public and app SVG icons exist and do not use Unicode 👍 emoji', () => {
      const publicIconPath = path.join(process.cwd(), 'public/icon.svg');
      const appIconPath = path.join(process.cwd(), 'src/app/icon.svg');

      assert.ok(fs.existsSync(publicIconPath), 'public/icon.svg must exist');
      assert.ok(fs.existsSync(appIconPath), 'src/app/icon.svg must exist');

      const publicContent = fs.readFileSync(publicIconPath, 'utf-8');
      const appContent = fs.readFileSync(appIconPath, 'utf-8');

      // Assert no raw Unicode emoji 👍 or \ud83d\udc4d
      assert.ok(!publicContent.includes('👍'), 'public/icon.svg must not use raw 👍 emoji');
      assert.ok(!appContent.includes('👍'), 'src/app/icon.svg must not use raw 👍 emoji');
      assert.ok(!publicContent.includes('\uD83D\uDC4D'), 'public/icon.svg must not contain thumbs-up emoji code');
      assert.ok(!appContent.includes('\uD83D\uDC4D'), 'src/app/icon.svg must not contain thumbs-up emoji code');

      // Assert custom vector paths exist
      assert.ok(publicContent.includes('<svg'), 'public/icon.svg must be a valid SVG');
      assert.ok(publicContent.includes('<path'), 'public/icon.svg must define vector paths');
    });

    it('verifies BrandLogo component exists with compact, full, and iconOnly variants', () => {
      const logoComponentPath = path.join(process.cwd(), 'src/components/ui/BrandLogo.tsx');
      assert.ok(fs.existsSync(logoComponentPath), 'BrandLogo.tsx must exist');

      const content = fs.readFileSync(logoComponentPath, 'utf-8');
      assert.ok(content.includes('export function BrandLogo'), 'Must export BrandLogo');
      assert.ok(content.includes('export function BrandMark'), 'Must export BrandMark');
      assert.ok(!content.includes('👍'), 'BrandLogo component must not use raw 👍 emoji');
    });
  });

  describe('Development-Facing UI Purge', () => {
    it('verifies zero "Phase " milestone labels in public tool registry badges', () => {
      for (const tool of TOOLS_REGISTRY) {
        if (tool.badge) {
          assert.ok(
            !/^Phase\s+\d/i.test(tool.badge),
            `Tool ${tool.slug} has development badge "${tool.badge}". Must be user-facing.`
          );
        }
      }
    });

    it('ensures user-facing badges are appropriately assigned', () => {
      const compress = TOOLS_REGISTRY.find((t) => t.slug === 'compress-pdf');
      assert.equal(compress?.badge, 'Optimized');

      const ocr = TOOLS_REGISTRY.find((t) => t.slug === 'ocr-pdf');
      assert.equal(ocr?.badge, 'Smart OCR');

      const editor = TOOLS_REGISTRY.find((t) => t.slug === 'pdf-editor');
      assert.equal(editor?.badge, 'Full Suite');
    });
  });

  describe('Expanded Tool Taxonomy (5 Categories)', () => {
    it('defines exactly 5 product-oriented categories', () => {
      assert.equal(TOOL_CATEGORIES.length, 5);
      const expectedIds = ['create-convert', 'edit', 'organize', 'optimize', 'secure'];
      const actualIds = TOOL_CATEGORIES.map((c) => c.id);
      assert.deepEqual(actualIds, expectedIds);
    });

    it('maps every single one of the 30 tools to one of the 5 categories', () => {
      assert.equal(TOOLS_REGISTRY.length, 30);
      const categoryIds = new Set(TOOL_CATEGORIES.map((c) => c.id));

      for (const tool of TOOLS_REGISTRY) {
        assert.ok(
          categoryIds.has(tool.category),
          `Tool ${tool.slug} has unmapped category "${tool.category}"`
        );
      }
    });

    it('ensures all 5 categories have at least one active tool', () => {
      for (const category of TOOL_CATEGORIES) {
        const tools = TOOLS_REGISTRY.filter((t) => t.category === category.id);
        assert.ok(tools.length > 0, `Category ${category.id} should have active tools`);
      }
    });
  });

  describe('Theme System Configuration', () => {
    it('verifies globals.css includes Tailwind v4 custom dark variant rule', () => {
      const cssPath = path.join(process.cwd(), 'src/app/globals.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      assert.ok(
        cssContent.includes('@custom-variant dark'),
        'globals.css must configure @custom-variant dark for class-based theme switching'
      );
      assert.ok(
        cssContent.includes('.no-theme-recolor'),
        'globals.css must include .no-theme-recolor to protect PDF rendering canvases'
      );
    });

    it('verifies layout.tsx has inline zero-flash script and ThemeProvider', () => {
      const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

      assert.ok(
        layoutContent.includes('pdfsimplify_theme'),
        'layout.tsx inline script must check localStorage pdfsimplify_theme'
      );
      assert.ok(
        layoutContent.includes('suppressHydrationWarning'),
        'layout.tsx html tag must have suppressHydrationWarning for anti-flash class'
      );
      assert.ok(
        layoutContent.includes('<ThemeProvider>'),
        'layout.tsx must wrap application in ThemeProvider'
      );
    });

    it('verifies ThemeToggle component exists and is keyboard accessible', () => {
      const togglePath = path.join(process.cwd(), 'src/components/theme/ThemeToggle.tsx');
      assert.ok(fs.existsSync(togglePath), 'ThemeToggle.tsx must exist');

      const content = fs.readFileSync(togglePath, 'utf-8');
      assert.ok(content.includes('aria-label'), 'ThemeToggle must include accessible aria-label');
      assert.ok(content.includes('role="listbox"') || content.includes('role="option"'), 'ThemeToggle must include accessible listbox roles');
    });
  });

  describe('Centralized Related Tool Engine', () => {
    it('expresses expected relationships for OCR PDF', () => {
      const rel = getCuratedRelationship('ocr-pdf');
      assert.ok(rel.relatedTools.includes('pdf-to-word'), 'OCR should relate to PDF to Word');
      assert.ok(rel.relatedTools.includes('pdf-to-text'), 'OCR should relate to PDF to Text');
      assert.ok(rel.relatedTools.includes('pdf-editor'), 'OCR should relate to PDF Editor');
    });

    it('expresses expected relationships for PDF to Word', () => {
      const rel = getCuratedRelationship('pdf-to-word');
      assert.ok(rel.relatedTools.includes('ocr-pdf'), 'PDF to Word should relate to OCR');
      assert.ok(rel.relatedTools.includes('pdf-to-text'), 'PDF to Word should relate to PDF to Text');
      assert.ok(rel.relatedTools.includes('compress-pdf'), 'PDF to Word should relate to Compress PDF');
      assert.ok(rel.relatedTools.includes('pdf-editor'), 'PDF to Word should relate to PDF Editor');
    });

    it('expresses expected relationships for PDF to PowerPoint', () => {
      const rel = getCuratedRelationship('pdf-to-ppt');
      assert.ok(rel.relatedTools.includes('pdf-to-word'), 'PDF to PPT should relate to PDF to Word');
      assert.ok(rel.relatedTools.includes('extract-pages'), 'PDF to PPT should relate to Extract Pages');
      assert.ok(rel.relatedTools.includes('compress-pdf'), 'PDF to PPT should relate to Compress PDF');
    });

    it('expresses expected relationships for Sign PDF', () => {
      const rel = getCuratedRelationship('sign-pdf');
      assert.ok(rel.relatedTools.includes('pdf-editor'), 'Sign PDF should relate to PDF Editor');
      assert.ok(rel.relatedTools.includes('fill-pdf'), 'Sign PDF should relate to Fill PDF');
      assert.ok(rel.relatedTools.includes('protect-pdf'), 'Sign PDF should relate to Protect PDF');
    });

    it('safely filters out non-registered tools without throwing errors', () => {
      const related = getRelatedTools('ocr-pdf');
      assert.ok(Array.isArray(related));
      // All returned tools must be valid active ToolMetadata objects
      for (const t of related) {
        assert.ok(t.slug && t.name);
      }
    });
  });

  describe('Conversion Architecture Foundation (DOCX & PPTX Builders)', () => {
    const mockLayout: ConversionDocumentLayout = {
      fileName: 'test-doc.pdf',
      fileSizeBytes: 10240,
      totalPages: 2,
      medianBodyFontSize: 12,
      pages: [
        {
          pageNumber: 1,
          width: 612,
          height: 792,
          rotation: 0,
          rawItemCount: 10,
          hasSelectableText: true,
          blocks: [
            {
              type: 'heading1',
              box: { x: 50, y: 50, width: 300, height: 28 },
              text: 'Annual Performance Report',
              fontSize: 24,
              isBold: true,
              isItalic: false,
              alignment: 'left',
              lines: [
                {
                  text: 'Annual Performance Report',
                  box: { x: 50, y: 50, width: 300, height: 28 },
                  dominantFontSize: 24,
                  isHeadingCandidate: true,
                  spans: [
                    {
                      text: 'Annual Performance Report',
                      box: { x: 50, y: 50, width: 300, height: 28 },
                      font: { name: 'Helvetica-Bold', size: 24, isBold: true, isItalic: false },
                    },
                  ],
                },
              ],
            },
            {
              type: 'paragraph',
              box: { x: 50, y: 100, width: 500, height: 40 },
              text: 'This document was reconstructed entirely inside the browser using zero backend APIs.',
              fontSize: 12,
              isBold: false,
              isItalic: false,
              alignment: 'left',
              lines: [
                {
                  text: 'This document was reconstructed entirely inside the browser using zero backend APIs.',
                  box: { x: 50, y: 100, width: 500, height: 40 },
                  dominantFontSize: 12,
                  isHeadingCandidate: false,
                  spans: [
                    {
                      text: 'This document was reconstructed entirely inside the browser using zero backend APIs.',
                      box: { x: 50, y: 100, width: 500, height: 40 },
                      font: { name: 'Helvetica', size: 12, isBold: false, isItalic: false },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          pageNumber: 2,
          width: 612,
          height: 792,
          rotation: 0,
          rawItemCount: 5,
          hasSelectableText: true,
          blocks: [
            {
              type: 'heading2',
              box: { x: 50, y: 60, width: 200, height: 20 },
              text: 'Financial Summary',
              fontSize: 16,
              isBold: true,
              isItalic: false,
              alignment: 'left',
              lines: [
                {
                  text: 'Financial Summary',
                  box: { x: 50, y: 60, width: 200, height: 20 },
                  dominantFontSize: 16,
                  isHeadingCandidate: true,
                  spans: [
                    {
                      text: 'Financial Summary',
                      box: { x: 50, y: 60, width: 200, height: 20 },
                      font: { name: 'Helvetica-Bold', size: 16, isBold: true, isItalic: false },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    it('builds a standards-compliant OpenXML DOCX archive with valid parts', async () => {
      const docxBytes = await buildDocxFromLayout(mockLayout, { includePageBreaks: true });
      assert.ok(docxBytes instanceof Uint8Array);
      assert.ok(docxBytes.length > 500, 'DOCX file must be non-trivial size');

      const isValid = await validateOpenXmlPackage(docxBytes, 'word/document.xml');
      assert.ok(isValid, 'DOCX must contain [Content_Types].xml, _rels/.rels, and word/document.xml');
    });

    it('builds a standards-compliant OpenXML PPTX presentation with valid slide parts', async () => {
      const pptxBytes = await buildPptxFromLayout(mockLayout);
      assert.ok(pptxBytes instanceof Uint8Array);
      assert.ok(pptxBytes.length > 500, 'PPTX file must be non-trivial size');

      const isValid = await validateOpenXmlPackage(pptxBytes, 'ppt/presentation.xml');
      assert.ok(isValid, 'PPTX must contain [Content_Types].xml, _rels/.rels, and ppt/presentation.xml');
    });

    it('derives clean deterministic filenames', () => {
      assert.equal(deriveOutputFilename('annual report 2026.pdf', '.docx'), 'annual_report_2026.docx');
      assert.equal(deriveOutputFilename('My Presentation.PDF', 'pptx'), 'My_Presentation.pptx');
      assert.equal(deriveOutputFilename('complex$#name.pdf', '.docx'), 'complex__name.docx');
    });

    it('manages cancellation tokens cooperatively', () => {
      const token = createCancellationToken();
      assert.equal(token.isCancelled, false);
      token.cancel();
      assert.equal(token.isCancelled, true);
    });
  });
});
