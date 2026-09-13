/**
 * PDFSimplify — Client-Side OpenXML PPTX Presentation Builder
 * Reconstructs PowerPoint (.pptx) presentations directly from PDF page layouts in-browser.
 * Each PDF page becomes an individual slide with positioned vector text shapes and formatting.
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

// 1 point = 12,700 English Metric Units (EMUs)
const PT_TO_EMU = 12700;

export async function buildPptxFromLayout(layout: ConversionDocumentLayout): Promise<Uint8Array> {
  const zip = new JSZip();

  const totalSlides = Math.max(1, layout.pages.length);

  // 1. [Content_Types].xml
  const slideOverrides = layout.pages
    .map(
      (_, idx) =>
        `<Override PartName="/ppt/slides/slide${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join('\n  ');

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  ${slideOverrides}
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`
  );

  // 3. ppt/_rels/presentation.xml.rels
  const presRels = layout.pages
    .map(
      (_, idx) =>
        `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx + 1}.xml"/>`
    )
    .join('\n  ');

  zip.file(
    'ppt/_rels/presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels}
</Relationships>`
  );

  // 4. ppt/presentation.xml
  const sldIdList = layout.pages
    .map((_, idx) => `<p:sldId id="${256 + idx}" r:id="rId${idx + 1}"/>`)
    .join('\n    ');

  // Standard 16:9 slide size (10 inches x 5.625 inches) in EMUs
  const slideWidthEmu = 9144000;
  const slideHeightEmu = 5143500;

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst/>
  <p:sldIdLst>
    ${sldIdList}
  </p:sldIdLst>
  <p:sldSz cx="${slideWidthEmu}" cy="${slideHeightEmu}" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`
  );

  // 5. docProps/core.xml
  const dateIso = new Date().toISOString();
  zip.file(
    'docProps/core.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">
  <dc:title>${escapeXml(layout.fileName || 'Presentation')}</dc:title>
  <dc:creator>PDFSimplify Client-Side Engine</dc:creator>
  <cp:lastModifiedBy>PDFSimplify</cp:lastModifiedBy>
  <dcterms:created>${dateIso}</dcterms:created>
  <dcterms:modified>${dateIso}</dcterms:modified>
</cp:coreProperties>`
  );

  // 6. Generate slides
  for (let idx = 0; idx < totalSlides; idx++) {
    const page = layout.pages[idx];
    const slideNumber = idx + 1;

    // Slide XML rels
    zip.file(
      `ppt/slides/_rels/slide${slideNumber}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`
    );

    // Build shapes for slide
    const shapesXml: string[] = [];
    const scaleX = page && page.width > 0 ? slideWidthEmu / (page.width * PT_TO_EMU) : 1;
    const scaleY = page && page.height > 0 ? slideHeightEmu / (page.height * PT_TO_EMU) : 1;

    if (page && page.blocks.length > 0) {
      for (let sIdx = 0; sIdx < page.blocks.length; sIdx++) {
        const block = page.blocks[sIdx];
        shapesXml.push(renderBlockToPptxShape(block, sIdx + 2, scaleX, scaleY));
      }
    } else {
      // Empty slide placeholder
      shapesXml.push(`
        <p:sp>
          <p:nvSpPr>
            <p:cNvPr id="2" name="Blank Page Note"/>
            <p:cNvSpPr txBox="1"/>
            <p:nvPr/>
          </p:nvSpPr>
          <p:spPr>
            <a:xfrm>
              <a:off x="914400" y="914400"/>
              <a:ext cx="7315200" cy="914400"/>
            </a:xfrm>
            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          </p:spPr>
          <p:txBody>
            <a:bodyPr wrap="square"/>
            <a:p><a:r><a:t xml:space="preserve">Page ${slideNumber}</a:t></a:r></a:p>
          </p:txBody>
        </p:sp>`);
    }

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      ${shapesXml.join('\n')}
    </p:spTree>
  </p:cSld>
</p:sld>`;

    zip.file(`ppt/slides/slide${slideNumber}.xml`, slideXml);
  }

  return zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

function renderBlockToPptxShape(block: TextBlock, shapeId: number, scaleX: number, scaleY: number): string {
  const xEmu = Math.round(block.box.x * PT_TO_EMU * scaleX);
  const yEmu = Math.round(block.box.y * PT_TO_EMU * scaleY);
  const wEmu = Math.max(914400, Math.round(block.box.width * PT_TO_EMU * scaleX));
  const hEmu = Math.max(365760, Math.round((block.box.height + 10) * PT_TO_EMU * scaleY));

  // DrawingML font size is hundredths of a point (14pt -> 1400)
  const fontSizeHpt = Math.round(Math.max(10, block.fontSize) * 100);
  const isBold = block.isBold || block.type === 'heading1' || block.type === 'heading2';

  const paragraphsXml = block.lines
    .map((line) => {
      const lineText = line.text.trim();
      if (!lineText) return '';

      return `
        <a:p>
          <a:r>
            <a:rPr lang="en-US" sz="${fontSizeHpt}" b="${isBold ? '1' : '0'}" i="${block.isItalic ? '1' : '0'}">
              <a:solidFill>
                <a:srgbClr val="${isBold ? '0F172A' : '334155'}"/>
              </a:solidFill>
            </a:rPr>
            <a:t xml:space="preserve">${escapeXml(lineText)}</a:t>
          </a:r>
        </a:p>`;
    })
    .filter(Boolean)
    .join('');

  return `
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${shapeId}" name="TextBox ${shapeId}"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="${xEmu}" y="${yEmu}"/>
          <a:ext cx="${wEmu}" cy="${hEmu}"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" rtlCol="0">
          <a:spAutoFit/>
        </a:bodyPr>
        <a:lstStyle/>
        ${paragraphsXml || `<a:p><a:r><a:t xml:space="preserve"> </a:t></a:r></a:p>`}
      </p:txBody>
    </p:sp>`;
}
