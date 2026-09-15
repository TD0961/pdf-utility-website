/**
 * PDFSimplify — Client-Side OpenXML DOCX Document Builder
 * Generates standards-compliant Microsoft Word (.docx) documents in-browser using JSZip.
 * Reconstructs headings, paragraphs, runs, styles, and page breaks without server APIs.
 */

import JSZip from 'jszip';
import { ConversionDocumentLayout, TextBlock } from './types';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface BuildDocxOptions {
  includePageBreaks?: boolean;
}

export async function buildDocxFromLayout(
  layout: ConversionDocumentLayout,
  options: BuildDocxOptions = { includePageBreaks: true }
): Promise<Uint8Array> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
  );

  // 3. word/_rels/document.xml.rels
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // 4. word/styles.xml
  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="24292F"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr>
      <w:spacing w:after="160" w:line="260" w:lineRule="auto"/>
    </w:pPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="360" w:after="140"/>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="36"/>
      <w:szCs w:val="36"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="240" w:after="100"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
      <w:color w:val="1E293B"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="180" w:after="80"/>
      <w:outlineLvl w:val="2"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
      <w:color w:val="334155"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="TOC1">
    <w:name w:val="toc 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="60" w:after="60"/>
      <w:tabs>
        <w:tab w:val="right" w:leader="dot" w:pos="9360"/>
      </w:tabs>
    </w:pPr>
    <w:rPr>
      <w:sz w:val="22"/>
      <w:szCs w:val="22"/>
      <w:color w:val="1E293B"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="TOC2">
    <w:name w:val="toc 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="40" w:after="40"/>
      <w:ind w:left="360"/>
      <w:tabs>
        <w:tab w:val="right" w:leader="dot" w:pos="9360"/>
      </w:tabs>
    </w:pPr>
    <w:rPr>
      <w:sz w:val="20"/>
      <w:szCs w:val="20"/>
      <w:color w:val="475569"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:ind w:left="720" w:hanging="360"/>
      <w:spacing w:after="80"/>
    </w:pPr>
  </w:style>
</w:styles>`
  );

  // 5. docProps/core.xml & app.xml
  const dateIso = new Date().toISOString();
  zip.file(
    'docProps/core.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/">
  <dc:title>${escapeXml(layout.fileName || 'Document')}</dc:title>
  <dc:creator>PDFSimplify Client-Side Engine</dc:creator>
  <cp:lastModifiedBy>PDFSimplify</cp:lastModifiedBy>
  <dcterms:created>${dateIso}</dcterms:created>
  <dcterms:modified>${dateIso}</dcterms:modified>
</cp:coreProperties>`
  );

  zip.file(
    'docProps/app.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>pdfsimplify.com Local Converter</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <Pages>${layout.totalPages}</Pages>
</Properties>`
  );

  // 6. word/document.xml
  const bodyXmlParts: string[] = [];
  let bookmarkCounter = 1;

  for (let pageIdx = 0; pageIdx < layout.pages.length; pageIdx++) {
    const page = layout.pages[pageIdx];

    // If subsequent page and page breaks requested, insert a page break paragraph
    if (pageIdx > 0 && options.includePageBreaks) {
      bodyXmlParts.push(
        `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`
      );
    }

    if (page.blocks.length === 0) {
      // Preserve blank page representation
      bodyXmlParts.push(
        `<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>`
      );
      continue;
    }

    for (const block of page.blocks) {
      bodyXmlParts.push(renderBlockToDocxXml(block, bookmarkCounter++));
    }
  }

  // Standard Letter / A4 section properties (twips: 1 inch = 1440 twips)
  bodyXmlParts.push(
    `<w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>`
  );

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXmlParts.join('\n    ')}
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);

  return zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

function renderBlockToDocxXml(block: TextBlock, bookmarkId: number): string {
  // 1. Table Block Rendering
  if (block.type === 'table' && block.tableData && block.tableData.rows.length > 0) {
    const rowsXml: string[] = [];
    for (let rIdx = 0; rIdx < block.tableData.rows.length; rIdx++) {
      const row = block.tableData.rows[rIdx];
      const isHeader = rIdx === 0;
      const cellsXml: string[] = [];

      for (const cellText of row) {
        cellsXml.push(
          `<w:tc>
            <w:tcPr>
              <w:tcMar>
                <w:top w:w="120" w:type="dxa"/>
                <w:bottom w:w="120" w:type="dxa"/>
                <w:left w:w="160" w:type="dxa"/>
                <w:right w:w="160" w:type="dxa"/>
              </w:tcMar>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:spacing w:after="40" w:line="220" w:lineRule="auto"/>
              </w:pPr>
              <w:r>
                ${isHeader ? '<w:rPr><w:b/></w:rPr>' : ''}
                <w:t xml:space="preserve">${escapeXml(cellText || ' ')}</w:t>
              </w:r>
            </w:p>
          </w:tc>`
        );
      }

      rowsXml.push(
        `<w:tr>
          ${isHeader ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}
          ${cellsXml.join('')}
        </w:tr>`
      );
    }

    return `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
          <w:insideV w:val="none"/>
          <w:left w:val="none"/>
          <w:right w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      ${rowsXml.join('')}
    </w:tbl>`;
  }

  // 2. Table of Contents (TOC) Item Rendering with Dot Leaders
  if (block.type === 'tocItem' && block.tocData) {
    const styleId = block.tocData.level === 2 ? 'TOC2' : 'TOC1';
    const cleanTitle = escapeXml(block.tocData.title);
    const pageNum = escapeXml(block.tocData.pageNumber);

    return `<w:p>
      <w:pPr>
        <w:pStyle w:val="${styleId}"/>
        <w:tabs>
          <w:tab w:val="right" w:leader="dot" w:pos="9360"/>
        </w:tabs>
      </w:pPr>
      <w:r>
        <w:t xml:space="preserve">${cleanTitle}</w:t>
      </w:r>
      <w:r>
        <w:tab/>
      </w:r>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="334155"/>
        </w:rPr>
        <w:t xml:space="preserve">${pageNum}</w:t>
      </w:r>
    </w:p>`;
  }

  // 3. Headings, Lists, and Paragraphs Rendering
  const pPrParts: string[] = [];

  if (block.type === 'heading1') {
    pPrParts.push('<w:pStyle w:val="Heading1"/>');
  } else if (block.type === 'heading2') {
    pPrParts.push('<w:pStyle w:val="Heading2"/>');
  } else if (block.type === 'heading3') {
    pPrParts.push('<w:pStyle w:val="Heading3"/>');
  } else if (block.type === 'listItem') {
    pPrParts.push('<w:pStyle w:val="ListParagraph"/>');
  }

  if (block.alignment === 'center') {
    pPrParts.push('<w:jc w:val="center"/>');
  } else if (block.alignment === 'right') {
    pPrParts.push('<w:jc w:val="right"/>');
  }

  const pPr = pPrParts.length > 0 ? `<w:pPr>${pPrParts.join('')}</w:pPr>` : '';

  // Render runs for each line / span
  const runsXml: string[] = [];

  for (let lIdx = 0; lIdx < block.lines.length; lIdx++) {
    const line = block.lines[lIdx];

    for (const span of line.spans) {
      if (!span.text) continue;

      const rPrParts: string[] = [];
      if (span.font.isBold || block.isBold) {
        rPrParts.push('<w:b/>');
      }
      if (span.font.isItalic || block.isItalic) {
        rPrParts.push('<w:i/>');
      }
      if (span.font.size && span.font.size > 0) {
        // Half-points (e.g. 12pt -> 24)
        const halfPt = Math.round(span.font.size * 2);
        rPrParts.push(`<w:sz w:val="${halfPt}"/><w:szCs w:val="${halfPt}"/>`);
      }

      const rPr = rPrParts.length > 0 ? `<w:rPr>${rPrParts.join('')}</w:rPr>` : '';
      runsXml.push(
        `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(span.text)}</w:t></w:r>`
      );
    }

    // Add space between lines within a paragraph if not the last line
    if (lIdx < block.lines.length - 1) {
      runsXml.push('<w:r><w:t xml:space="preserve"> </w:t></w:r>');
    }
  }

  // If this is a major heading, wrap in bookmark for TOC / navigation linking
  if (block.type === 'heading1' || block.type === 'heading2') {
    const bmName = `_Heading_${bookmarkId}`;
    return `<w:p>${pPr}<w:bookmarkStart w:id="${bookmarkId}" w:name="${bmName}"/>${runsXml.join('')}<w:bookmarkEnd w:id="${bookmarkId}"/></w:p>`;
  }

  return `<w:p>${pPr}${runsXml.join('')}</w:p>`;
}
