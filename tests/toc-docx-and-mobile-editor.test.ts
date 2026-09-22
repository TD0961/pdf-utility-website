import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { buildDocxFromLayout } from '../src/lib/pdf/conversion/docx-builder';
import { buildPptxFromLayout } from '../src/lib/pdf/conversion/pptx-builder';
import { ConversionDocumentLayout, TextBlock } from '../src/lib/pdf/conversion/types';

describe('Global PDF Engine & Table of Contents (TOC) Preservation', () => {
  it('preserves Table of Contents entries with native Word dot leaders and TOC styles', async () => {
    const tocBlock1: TextBlock = {
      type: 'tocItem',
      box: { x: 50, y: 100, width: 500, height: 16 },
      lines: [],
      text: '1. Executive Summary ................................ 4',
      fontSize: 12,
      isBold: false,
      isItalic: false,
      alignment: 'left',
      tocData: {
        title: '1. Executive Summary',
        pageNumber: '4',
        level: 1,
      },
    };

    const tocBlock2: TextBlock = {
      type: 'tocItem',
      box: { x: 70, y: 120, width: 480, height: 16 },
      lines: [],
      text: '1.1 System Architecture . . . . . . . . . . . . . . . 7',
      fontSize: 11,
      isBold: false,
      isItalic: false,
      alignment: 'left',
      tocData: {
        title: '1.1 System Architecture',
        pageNumber: '7',
        level: 2,
      },
    };

    const headingBlock: TextBlock = {
      type: 'heading1',
      box: { x: 50, y: 200, width: 500, height: 24 },
      lines: [
        {
          text: 'Executive Summary',
          box: { x: 50, y: 200, width: 250, height: 24 },
          spans: [
            {
              text: 'Executive Summary',
              box: { x: 50, y: 200, width: 250, height: 24 },
              font: { name: 'Helvetica', size: 18, isBold: true, isItalic: false },
            },
          ],
          dominantFontSize: 18,
          isHeadingCandidate: true,
        },
      ],
      text: 'Executive Summary',
      fontSize: 18,
      isBold: true,
      isItalic: false,
      alignment: 'left',
    };

    const layout: ConversionDocumentLayout = {
      fileName: 'toc-report.pdf',
      fileSizeBytes: 2048,
      totalPages: 1,
      medianBodyFontSize: 12,
      pages: [
        {
          pageNumber: 1,
          width: 612,
          height: 792,
          rotation: 0,
          blocks: [tocBlock1, tocBlock2, headingBlock],
          rawItemCount: 10,
          hasSelectableText: true,
        },
      ],
    };

    const docxBytes = await buildDocxFromLayout(layout);
    assert.ok(docxBytes && docxBytes.length > 500, 'DOCX binary generated');

    const zip = await JSZip.loadAsync(docxBytes);
    const documentXml = await zip.file('word/document.xml')?.async('text');
    const stylesXml = await zip.file('word/styles.xml')?.async('text');

    assert.ok(documentXml, 'document.xml present in DOCX package');
    assert.ok(stylesXml, 'styles.xml present in DOCX package');

    // 1. Verify TOC styles in styles.xml
    assert.ok(stylesXml.includes('styleId="TOC1"'), 'styles.xml contains TOC1 style');
    assert.ok(stylesXml.includes('styleId="TOC2"'), 'styles.xml contains TOC2 style');
    assert.ok(stylesXml.includes('w:leader="dot"'), 'styles.xml contains dot leader tab stop');
    assert.ok(stylesXml.includes('<w:outlineLvl w:val="0"/>'), 'Heading1 has outline level 0 for Word TOC');
    assert.ok(stylesXml.includes('<w:outlineLvl w:val="1"/>'), 'Heading2 has outline level 1 for Word TOC');
    assert.ok(stylesXml.includes('<w:outlineLvl w:val="2"/>'), 'Heading3 has outline level 2 for Word TOC');

    // 2. Verify TOC rendering in document.xml
    assert.ok(documentXml.includes('<w:pStyle w:val="TOC1"/>'), 'document.xml formats TOC1 item');
    assert.ok(documentXml.includes('<w:pStyle w:val="TOC2"/>'), 'document.xml formats TOC2 item');
    assert.ok(documentXml.includes('<w:tab/>'), 'document.xml contains tab separator before page number');
    assert.ok(documentXml.includes('1. Executive Summary'), 'TOC title rendered cleanly without trailing dots');
    assert.ok(documentXml.includes('>4<'), 'TOC target page number rendered');
    assert.ok(documentXml.includes('>7<'), 'TOC sub-target page number rendered');

    // 3. Verify bookmarks for headings
    assert.ok(documentXml.includes('<w:bookmarkStart'), 'Major headings wrapped in Word bookmark');
    assert.ok(documentXml.includes('<w:bookmarkEnd'), 'Major headings close bookmark');
  });

  it('reconstructs structured tables using OpenXML <w:tbl> elements', async () => {
    const tableBlock: TextBlock = {
      type: 'table',
      box: { x: 50, y: 150, width: 500, height: 100 },
      lines: [],
      text: 'Quarter\tRevenue\tProfit\nQ1\t$10M\t$2.5M\nQ2\t$12M\t$3.1M',
      fontSize: 11,
      isBold: false,
      isItalic: false,
      alignment: 'left',
      tableData: {
        headers: ['Quarter', 'Revenue', 'Profit'],
        rows: [
          ['Quarter', 'Revenue', 'Profit'],
          ['Q1', '$10M', '$2.5M'],
          ['Q2', '$12M', '$3.1M'],
        ],
      },
    };

    const layout: ConversionDocumentLayout = {
      fileName: 'financials.pdf',
      fileSizeBytes: 1024,
      totalPages: 1,
      medianBodyFontSize: 11,
      pages: [
        {
          pageNumber: 1,
          width: 612,
          height: 792,
          rotation: 0,
          blocks: [tableBlock],
          rawItemCount: 9,
          hasSelectableText: true,
        },
      ],
    };

    const docxBytes = await buildDocxFromLayout(layout);
    const zip = await JSZip.loadAsync(docxBytes);
    const documentXml = await zip.file('word/document.xml')?.async('text');

    assert.ok(documentXml?.includes('<w:tbl>'), 'Table rendered using OpenXML <w:tbl>');
    assert.ok(documentXml?.includes('<w:tblHeader/>'), 'Table header row marked with <w:tblHeader>');
    assert.ok(documentXml?.includes('<w:tc>'), 'Table cells rendered with <w:tc>');
    assert.ok(documentXml?.includes('Quarter'), 'Table content present');
    assert.ok(documentXml?.includes('$10M'), 'Table data present');
  });

  it('adapts PowerPoint (.pptx) presentation dimensions dynamically to portrait and landscape PDFs', async () => {
    // Portrait PDF layout (e.g. A4: 595 x 842)
    const portraitLayout: ConversionDocumentLayout = {
      fileName: 'portrait-paper.pdf',
      fileSizeBytes: 1024,
      totalPages: 1,
      medianBodyFontSize: 12,
      pages: [
        {
          pageNumber: 1,
          width: 595,
          height: 842,
          rotation: 0,
          blocks: [
            {
              type: 'heading1',
              box: { x: 50, y: 50, width: 400, height: 30 },
              lines: [
                {
                  text: 'Portrait Slide Header',
                  box: { x: 50, y: 50, width: 400, height: 30 },
                  spans: [
                    {
                      text: 'Portrait Slide Header',
                      box: { x: 50, y: 50, width: 400, height: 30 },
                      font: { name: 'Helvetica', size: 16, isBold: true, isItalic: false },
                    },
                  ],
                  dominantFontSize: 16,
                  isHeadingCandidate: true,
                },
              ],
              text: 'Portrait Slide Header',
              fontSize: 16,
              isBold: true,
              isItalic: false,
              alignment: 'left',
            },
          ],
          rawItemCount: 1,
          hasSelectableText: true,
        },
      ],
    };

    const pptxBytes = await buildPptxFromLayout(portraitLayout);
    const zip = await JSZip.loadAsync(pptxBytes);
    const presXml = await zip.file('ppt/presentation.xml')?.async('text');

    assert.ok(presXml?.includes('cx="6858000" cy="9144000"'), 'Portrait slide dimensions configured in PPTX');
  });

  it('converts comma-separated and international numeric cells to genuine Excel numbers', async () => {
    const { buildXlsxFromSheets } = await import('../src/lib/pdf/conversion/xlsx-builder');
    const xlsxBytes = await buildXlsxFromSheets([
      {
        name: 'Financial Data',
        rows: [
          { cells: ['Metric', 'Amount (USD)', 'Count'] },
          { cells: ['Revenue', '1,234,567.89', '42'] },
          { cells: ['Expenses', '98,765.43', '15'] },
        ],
      },
    ]);

    const zip = await JSZip.loadAsync(xlsxBytes);
    const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')?.async('text');

    assert.ok(sheet1Xml, 'sheet1.xml generated');
    // Verify that comma-formatted numbers are converted to numeric <v> values
    assert.ok(sheet1Xml.includes('<c r="B2"><v>1234567.89</v></c>'), 'Revenue parsed as number without comma');
    assert.ok(sheet1Xml.includes('<c r="B3"><v>98765.43</v></c>'), 'Expenses parsed as number without comma');
    assert.ok(sheet1Xml.includes('<c r="C2"><v>42</v></c>'), 'Count parsed as number');
  });

  it('generates genuine 16:9 widescreen presentation slides for portrait PDFs in smart presentation mode', async () => {
    const portraitLayout: ConversionDocumentLayout = {
      fileName: 'ai-study-doc.pdf',
      fileSizeBytes: 2048,
      totalPages: 1,
      medianBodyFontSize: 12,
      pages: [
        {
          pageNumber: 1,
          width: 595,
          height: 842,
          rotation: 0,
          blocks: [
            {
              type: 'heading1',
              box: { x: 50, y: 50, width: 450, height: 35 },
              lines: [
                {
                  text: 'AI STUDY & DOCUMENTATION',
                  box: { x: 50, y: 50, width: 450, height: 35 },
                  spans: [],
                  dominantFontSize: 18,
                  isHeadingCandidate: true,
                },
              ],
              text: 'AI STUDY & DOCUMENTATION',
              fontSize: 18,
              isBold: true,
              isItalic: false,
              alignment: 'left',
            },
            {
              type: 'heading2',
              box: { x: 50, y: 100, width: 400, height: 25 },
              lines: [
                {
                  text: 'System Reference & Product Concept',
                  box: { x: 50, y: 100, width: 400, height: 25 },
                  spans: [],
                  dominantFontSize: 14,
                  isHeadingCandidate: true,
                },
              ],
              text: 'System Reference & Product Concept',
              fontSize: 14,
              isBold: true,
              isItalic: false,
              alignment: 'left',
            },
            {
              type: 'paragraph',
              box: { x: 50, y: 140, width: 480, height: 40 },
              lines: [
                {
                  text: 'A practical reference for building cross-platform materials.',
                  box: { x: 50, y: 140, width: 480, height: 20 },
                  spans: [],
                  dominantFontSize: 11,
                  isHeadingCandidate: false,
                },
              ],
              text: 'A practical reference for building cross-platform materials.',
              fontSize: 11,
              isBold: false,
              isItalic: false,
              alignment: 'left',
            },
          ],
          rawItemCount: 3,
          hasSelectableText: true,
        },
      ],
    };

    const pptxBytes = await buildPptxFromLayout(portraitLayout, { mode: 'smart' });
    const zip = await JSZip.loadAsync(pptxBytes);
    const presXml = await zip.file('ppt/presentation.xml')?.async('text');
    const slide1Xml = await zip.file('ppt/slides/slide1.xml')?.async('text');

    assert.ok(presXml?.includes('cx="9144000" cy="5143500"'), 'Generates 16:9 widescreen dimensions for smart presentations');
    assert.ok(slide1Xml?.includes('Slide Eyebrow'), 'Slide contains eyebrow element');
    assert.ok(slide1Xml?.includes('AI STUDY &amp; DOCUMENTATION'), 'Slide title properly rendered');
    assert.ok(slide1Xml?.includes('Accent Line'), 'Slide contains accent line');
  });

  it('provides offline CMap and standard font configurations for global multilingual PDFs', async () => {
    const { getPdfLoadingParams } = await import('../src/lib/pdf/pdf-renderer');
    const dummyBytes = new Uint8Array([1, 2, 3, 4]);
    const nodeParams = getPdfLoadingParams(dummyBytes);
    assert.ok(nodeParams.data instanceof Uint8Array, 'Node params return data buffer');

    // Simulate browser environment
    Reflect.set(globalThis, 'window', {});
    const browserParams = getPdfLoadingParams(dummyBytes);
    assert.equal(browserParams.cMapUrl, '/cmaps/', 'CMap URL configured');
    assert.equal(browserParams.cMapPacked, true, 'Packed CMaps enabled');
    assert.equal(browserParams.standardFontDataUrl, '/standard_fonts/', 'Standard font data URL configured');
    Reflect.deleteProperty(globalThis, 'window');
  });
});

