/**
 * PDFSimplify — Client-Side OpenXML PPTX Presentation Builder
 * Reconstructs professional Microsoft PowerPoint (.pptx) presentations directly from PDF layouts.
 * Features standard OpenXML PresentationML schemas (slideMaster, slideLayout, theme),
 * intelligent slide structuring, anti-overload content pagination, and native DrawingML tables.
 */

import JSZip from 'jszip';
import { ConversionDocumentLayout, ConversionPageLayout, TextBlock } from './types';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 1 point = 12,700 English Metric Units (EMUs)
const PT_TO_EMU = 12700;

export interface BuildPptxOptions {
  mode?: 'smart' | 'exact';
  theme?: 'modern' | 'dark';
}

export interface PptxSlideSummary {
  title: string;
  bulletCount: number;
  previewText: string;
}

interface PreparedSlide {
  title: string;
  subtitle?: string;
  sourcePageNumber: number;
  sections: Array<{
    heading?: string;
    items: string[];
  }>;
  tableBlock?: TextBlock;
  rawBlocks?: TextBlock[];
}

export async function buildPptxFromLayout(
  layout: ConversionDocumentLayout,
  options: BuildPptxOptions = {}
): Promise<Uint8Array> {
  const zip = new JSZip();
  const mode = options.mode || 'smart';
  const isDark = options.theme === 'dark';

  // 1. Determine slide dimensions
  const firstPage = layout.pages[0];
  const isPortrait = Boolean(firstPage && firstPage.height > firstPage.width);

  // In Smart Presentation Mode (default), always generate 16:9 widescreen presentation slides!
  // In Exact Mode on portrait, preserve page aspect ratio for coordinate mapping.
  const isExactMode = mode === 'exact' || (!options.mode && isPortrait);

  let slideWidthEmu = 9144000;  // 10 inches (16:9 standard)
  let slideHeightEmu = 5143500; // 5.625 inches
  let slideType = 'screen16x9';

  if (isExactMode && isPortrait) {
    slideWidthEmu = 6858000;
    slideHeightEmu = 9144000;
    slideType = 'screen4x3';
  } else if (!isPortrait && firstPage && firstPage.width / firstPage.height < 1.45) {
    slideWidthEmu = 9144000;
    slideHeightEmu = 6858000;
    slideType = 'screen4x3';
  }

  // 2. Prepare slides according to layout mode & anti-overload rules
  const preparedSlides: PreparedSlide[] = [];

  for (let pIdx = 0; pIdx < layout.pages.length; pIdx++) {
    const page = layout.pages[pIdx];
    if (isExactMode) {
      // 1 slide per page directly with coordinate mapping
      const titleCandidate = findPageTitle(page);
      preparedSlides.push({
        title: titleCandidate || `Slide ${pIdx + 1}`,
        sourcePageNumber: page.pageNumber,
        sections: [],
        rawBlocks: page.blocks,
      });
    } else {
      // Smart Presentation Mode: chunk dense pages into structured 16:9 presentation slides
      const pageSlides = decomposePageIntoSlides(page, pIdx + 1);
      preparedSlides.push(...pageSlides);
    }
  }

  // Ensure at least 1 slide exists
  if (preparedSlides.length === 0) {
    preparedSlides.push({
      title: 'Presentation Overview',
      sourcePageNumber: 1,
      sections: [{ items: ['No text detected in document.'] }],
    });
  }

  const totalSlides = preparedSlides.length;

  // 3. [Content_Types].xml
  const slideOverrides = preparedSlides
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
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${slideOverrides}
</Types>`
  );

  // 4. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
  );

  // 5. ppt/_rels/presentation.xml.rels
  const presRels = preparedSlides
    .map(
      (_, idx) =>
        `<Relationship Id="rIdSlide${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx + 1}.xml"/>`
    )
    .join('\n  ');

  zip.file(
    'ppt/_rels/presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdMaster1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rIdTheme1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  ${presRels}
</Relationships>`
  );

  // 6. ppt/presentation.xml
  const sldIdList = preparedSlides
    .map((_, idx) => `<p:sldId id="${256 + idx}" r:id="rIdSlide${idx + 1}"/>`)
    .join('\n    ');

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rIdMaster1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${sldIdList}
  </p:sldIdLst>
  <p:sldSz cx="${slideWidthEmu}" cy="${slideHeightEmu}" type="${slideType}"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`
  );

  // 7. ppt/theme/theme1.xml
  const primaryTextColor = isDark ? 'F8FAFC' : '0F172A';
  const secondaryTextColor = isDark ? '94A3B8' : '334155';
  const bgColor = isDark ? '0F172A' : 'FFFFFF';
  const cardBgColor = isDark ? '1E293B' : 'F8FAFC';

  zip.file(
    'ppt/theme/theme1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="PDFSimplify">
      <a:dk1><a:srgbClr val="${primaryTextColor}"/></a:dk1>
      <a:lt1><a:srgbClr val="${bgColor}"/></a:lt1>
      <a:dk2><a:srgbClr val="${secondaryTextColor}"/></a:dk2>
      <a:lt2><a:srgbClr val="${cardBgColor}"/></a:lt2>
      <a:accent1><a:srgbClr val="4F46E5"/></a:accent1>
      <a:accent2><a:srgbClr val="06B6D4"/></a:accent2>
      <a:accent3><a:srgbClr val="10B981"/></a:accent3>
      <a:accent4><a:srgbClr val="F59E0B"/></a:accent4>
      <a:accent5><a:srgbClr val="EF4444"/></a:accent5>
      <a:accent6><a:srgbClr val="8B5CF6"/></a:accent6>
      <a:hlink><a:srgbClr val="4F46E5"/></a:hlink>
      <a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont>
        <a:latin typeface="Calibri"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Calibri"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="28575"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`
  );

  // 8. ppt/slideMasters/slideMaster1.xml and rels
  zip.file(
    'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdLayout1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`
  );

  zip.file(
    'ppt/slideMasters/slideMaster1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
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
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rIdLayout1"/>
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle>
      <a:lvl1pPr algn="l">
        <a:defRPr sz="2800" b="1">
          <a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
          <a:latin typeface="Calibri"/>
        </a:defRPr>
      </a:lvl1pPr>
    </p:titleStyle>
    <p:bodyStyle>
      <a:lvl1pPr marL="285750" indent="-285750" algn="l">
        <a:buFont typeface="Arial"/>
        <a:buChar char="•"/>
        <a:defRPr sz="1800">
          <a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
          <a:latin typeface="Calibri"/>
        </a:defRPr>
      </a:lvl1pPr>
    </p:bodyStyle>
    <p:otherStyle/>
  </p:txStyles>
</p:sldMaster>`
  );

  // 9. ppt/slideLayouts/slideLayout1.xml and rels
  zip.file(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`
  );

  zip.file(
    'ppt/slideLayouts/slideLayout1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="titleAndContent" preserve="1">
  <p:cSld name="Title and Content">
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
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`
  );

  // 10. docProps/core.xml & app.xml
  const dateIso = new Date().toISOString();
  zip.file(
    'docProps/core.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">
  <dc:title>${escapeXml(layout.fileName || 'Presentation')}</dc:title>
  <dc:creator>PDFSimplify Presentation Engine</dc:creator>
  <cp:lastModifiedBy>PDFSimplify</cp:lastModifiedBy>
  <dcterms:created>${dateIso}</dcterms:created>
  <dcterms:modified>${dateIso}</dcterms:modified>
</cp:coreProperties>`
  );

  zip.file(
    'docProps/app.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>pdfsimplify.com Presentation Engine</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <Slides>${totalSlides}</Slides>
</Properties>`
  );

  // 11. Generate slides
  for (let idx = 0; idx < totalSlides; idx++) {
    const slide = preparedSlides[idx];
    const slideNumber = idx + 1;

    // Slide XML rels
    zip.file(
      `ppt/slides/_rels/slide${slideNumber}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`
    );

    // Build shapes for this slide
    const shapesXml: string[] = [];

    if (slide.rawBlocks && slide.rawBlocks.length > 0) {
      // Exact positional mode
      const page = layout.pages.find((p) => p.pageNumber === slide.sourcePageNumber) || layout.pages[0];
      const scaleX = page && page.width > 0 ? slideWidthEmu / (page.width * PT_TO_EMU) : 1;
      const scaleY = page && page.height > 0 ? slideHeightEmu / (page.height * PT_TO_EMU) : 1;

      for (let sIdx = 0; sIdx < slide.rawBlocks.length; sIdx++) {
        const block = slide.rawBlocks[sIdx];
        shapesXml.push(renderBlockToPptxShape(block, sIdx + 2, scaleX, scaleY, isDark));
      }
    } else {
      // Smart Presentation Mode
      shapesXml.push(
        ...renderSmartSlideShapes(slide, slideNumber, totalSlides, slideWidthEmu, isDark, layout.fileName)
      );
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
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;

    zip.file(`ppt/slides/slide${slideNumber}.xml`, slideXml);
  }

  return zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Extracts slides summary metadata for in-browser inspection & presentation preview
 */
export function extractSlidesSummary(layout: ConversionDocumentLayout): PptxSlideSummary[] {
  const summaries: PptxSlideSummary[] = [];

  for (let pIdx = 0; pIdx < layout.pages.length; pIdx++) {
    const page = layout.pages[pIdx];
    const slides = decomposePageIntoSlides(page, pIdx + 1);

    for (const slide of slides) {
      let bulletCount = 0;
      const previewPieces: string[] = [];

      for (const s of slide.sections) {
        bulletCount += s.items.length;
        previewPieces.push(...s.items.slice(0, 2));
      }

      summaries.push({
        title: slide.title,
        bulletCount,
        previewText: previewPieces.join(' • ').slice(0, 160) || 'Slide presentation content',
      });
    }
  }

  return summaries;
}

/**
 * Decomposes a dense PDF page into uncrowded, presentation-ready slides
 */
function decomposePageIntoSlides(
  page: ConversionPageLayout,
  pageNumber: number
): PreparedSlide[] {
  if (page.blocks.length === 0) {
    return [
      {
        title: `Slide ${pageNumber}`,
        sourcePageNumber: pageNumber,
        sections: [
          {
            items: ['(Scanned / Image Page — OCR Recommended for Text Editing)'],
          },
        ],
      },
    ];
  }

  // 1. Identify primary title
  const titleBlock = findPageTitle(page);
  const baseTitle = titleBlock || `Page ${pageNumber} Overview`;

  // 2. Separate tables vs text blocks
  const tableBlocks = page.blocks.filter((b) => b.type === 'table' && b.tableData);
  const nonTableBlocks = page.blocks.filter(
    (b) => b.type !== 'table' && b.text.trim() !== titleBlock
  );

  // 3. Extract items grouped by subheadings
  const sections: Array<{ heading?: string; items: string[] }> = [];
  let currentSection: { heading?: string; items: string[] } = { items: [] };

  for (const block of nonTableBlocks) {
    const trimmed = block.text.trim();
    if (!trimmed) continue;

    // Filter out running page numbers like "Page 1 of 12"
    if (/^(Page\s+\d+(\s+of\s+\d+)?|\d+)$/i.test(trimmed)) {
      continue;
    }

    if (block.type === 'heading2' || block.type === 'heading3') {
      if (currentSection.items.length > 0 || currentSection.heading) {
        sections.push(currentSection);
      }
      currentSection = { heading: trimmed, items: [] };
    } else {
      // Split into clean sentence / bullet items
      const lines = block.lines
        .map((l) => l.text.trim())
        .filter((t) => t.length > 0);

      if (lines.length <= 2) {
        currentSection.items.push(trimmed);
      } else {
        // Break multi-line paragraphs into distinct cohesive presentation points
        currentSection.items.push(...lines);
      }
    }
  }

  if (currentSection.items.length > 0 || currentSection.heading) {
    sections.push(currentSection);
  }

  // If table block exists, give it its own dedicated slide
  const resultSlides: PreparedSlide[] = [];

  if (tableBlocks.length > 0) {
    for (const tbl of tableBlocks) {
      resultSlides.push({
        title: `${baseTitle} (Data Table)`,
        sourcePageNumber: pageNumber,
        sections: [],
        tableBlock: tbl,
      });
    }
  }

  // 4. Anti-overload chunking: maximum 5-6 points per slide
  const MAX_ITEMS_PER_SLIDE = 5;
  const allItems: Array<{ heading?: string; item: string }> = [];

  for (const sec of sections) {
    for (let i = 0; i < sec.items.length; i++) {
      allItems.push({
        heading: i === 0 ? sec.heading : undefined,
        item: sec.items[i],
      });
    }
  }

  if (allItems.length <= MAX_ITEMS_PER_SLIDE) {
    resultSlides.push({
      title: baseTitle,
      sourcePageNumber: pageNumber,
      sections,
    });
  } else {
    // Paginate into sequential slides
    const chunkCount = Math.ceil(allItems.length / MAX_ITEMS_PER_SLIDE);
    for (let cIdx = 0; cIdx < chunkCount; cIdx++) {
      const slice = allItems.slice(cIdx * MAX_ITEMS_PER_SLIDE, (cIdx + 1) * MAX_ITEMS_PER_SLIDE);
      const chunkSections: Array<{ heading?: string; items: string[] }> = [];

      let activeGroup: { heading?: string; items: string[] } = { items: [] };
      for (const entry of slice) {
        if (entry.heading && activeGroup.items.length > 0) {
          chunkSections.push(activeGroup);
          activeGroup = { heading: entry.heading, items: [] };
        } else if (entry.heading) {
          activeGroup.heading = entry.heading;
        }
        activeGroup.items.push(entry.item);
      }
      if (activeGroup.items.length > 0) {
        chunkSections.push(activeGroup);
      }

      resultSlides.push({
        title: cIdx === 0 ? baseTitle : `${baseTitle} (Part ${cIdx + 1})`,
        sourcePageNumber: pageNumber,
        sections: chunkSections,
      });
    }
  }

  return resultSlides.length > 0
    ? resultSlides
    : [
        {
          title: baseTitle,
          sourcePageNumber: pageNumber,
          sections: [{ items: ['Document page converted to presentation.'] }],
        },
      ];
}

function findPageTitle(page: ConversionPageLayout): string | null {
  for (const block of page.blocks) {
    if (block.type === 'heading1' && block.text.trim()) {
      return block.text.trim();
    }
  }
  for (const block of page.blocks) {
    if ((block.type === 'heading2' || block.isBold) && block.text.trim()) {
      return block.text.trim();
    }
  }
  const firstBlock = page.blocks[0];
  if (firstBlock && firstBlock.text.trim() && firstBlock.text.trim().length < 80) {
    return firstBlock.text.trim();
  }
  return null;
}

/**
 * Renders smart slide shapes: Title text, Indigo accent bar, Content card/bullets, Footer
 */
function renderSmartSlideShapes(
  slide: PreparedSlide,
  slideNumber: number,
  totalSlides: number,
  slideWidthEmu: number,
  isDark: boolean,
  docName: string
): string[] {
  const shapes: string[] = [];
  let shapeId = 2;

  const titleColor = isDark ? 'FFFFFF' : '0F172A';
  const subtitleColor = isDark ? '94A3B8' : '64748B';
  const bodyTextColor = isDark ? 'E2E8F0' : '334155';
  const cardBg = isDark ? '1E293B' : 'F8FAFC';
  const cardBorder = isDark ? '334155' : 'E2E8F0';

  const cleanTitle = escapeXml(slide.title);

  // 1. Category Eyebrow Pill
  shapes.push(`
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${shapeId++}" name="Slide Eyebrow"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="685800" y="320040"/>
          <a:ext cx="7772400" cy="182880"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/>
        <a:lstStyle/>
        <a:p>
          <a:r>
            <a:rPr lang="en-US" sz="950" b="1">
              <a:solidFill><a:srgbClr val="4F46E5"/></a:solidFill>
              <a:latin typeface="Calibri"/>
            </a:rPr>
            <a:t xml:space="preserve">SECTION ${slide.sourcePageNumber}  •  PRESENTATION SLIDE ${slideNumber}</a:t>
          </a:r>
        </a:p>
      </p:txBody>
    </p:sp>`);

  // 2. Slide Title
  shapes.push(`
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${shapeId++}" name="Slide Title"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="685800" y="520000"/>
          <a:ext cx="7772400" cy="580000"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/>
        <a:lstStyle/>
        <a:p>
          <a:r>
            <a:rPr lang="en-US" sz="2600" b="1">
              <a:solidFill><a:srgbClr val="${titleColor}"/></a:solidFill>
              <a:latin typeface="Calibri"/>
            </a:rPr>
            <a:t xml:space="preserve">${cleanTitle}</a:t>
          </a:r>
        </a:p>
      </p:txBody>
    </p:sp>`);

  // 3. Indigo Accent Line
  shapes.push(`
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${shapeId++}" name="Accent Line"/>
        <p:cNvSpPr/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="685800" y="1143000"/>
          <a:ext cx="1028700" cy="38100"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="4F46E5"/></a:solidFill>
        <a:ln><a:noFill/></a:ln>
      </p:spPr>
    </p:sp>`);

  // 4. Table rendering if present
  if (slide.tableBlock && slide.tableBlock.tableData) {
    const tableData = slide.tableBlock.tableData;
    const maxCols = Math.max(1, ...tableData.rows.map((r) => r.length));
    const totalTableWidth = 7772400;
    const colWidth = Math.floor(totalTableWidth / maxCols);

    const gridCols = Array.from({ length: maxCols })
      .map(() => `<a:gridCol w="${colWidth}"/>`)
      .join('');

    const rowsXml = tableData.rows
      .slice(0, 8)
      .map((row, rIdx) => {
        const isHeader = rIdx === 0;
        const cellBg = isHeader
          ? (isDark ? '4F46E5' : '4338CA')
          : rIdx % 2 === 1
          ? (isDark ? '1E293B' : 'F1F5F9')
          : cardBg;
        const cellTextColor = isHeader ? 'FFFFFF' : bodyTextColor;

        const cellsXml = row
          .map((cell) => {
            return `
              <a:tc>
                <a:txBody>
                  <a:bodyPr lIns="91440" tIns="91440" rIns="91440" bIns="91440"/>
                  <a:lstStyle/>
                  <a:p>
                    <a:r>
                      <a:rPr lang="en-US" sz="1300" b="${isHeader ? '1' : '0'}">
                        <a:solidFill><a:srgbClr val="${cellTextColor}"/></a:solidFill>
                        <a:latin typeface="Calibri"/>
                      </a:rPr>
                      <a:t xml:space="preserve">${escapeXml(cell || ' ')}</a:t>
                    </a:r>
                  </a:p>
                </a:txBody>
                <a:tcPr>
                  <a:solidFill><a:srgbClr val="${cellBg}"/></a:solidFill>
                  <a:lnL w="9525"><a:solidFill><a:srgbClr val="${cardBorder}"/></a:solidFill></a:lnL>
                  <a:lnR w="9525"><a:solidFill><a:srgbClr val="${cardBorder}"/></a:solidFill></a:lnR>
                  <a:lnT w="9525"><a:solidFill><a:srgbClr val="${cardBorder}"/></a:solidFill></a:lnT>
                  <a:lnB w="9525"><a:solidFill><a:srgbClr val="${cardBorder}"/></a:solidFill></a:lnB>
                </a:tcPr>
              </a:tc>`;
          })
          .join('');

        return `<a:tr h="365760">${cellsXml}</a:tr>`;
      })
      .join('');

    shapes.push(`
      <p:graphicFrame>
        <p:nvGraphicFramePr>
          <p:cNvPr id="${shapeId++}" name="Table ${shapeId}"/>
          <p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>
          <p:nvPr/>
        </p:nvGraphicFramePr>
        <p:xfrm>
          <a:off x="685800" y="1371600"/>
          <a:ext cx="${totalTableWidth}" cy="3200400"/>
        </p:xfrm>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
            <a:tbl>
              <a:tblPr/>
              <a:tblGrid>${gridCols}</a:tblGrid>
              ${rowsXml}
            </a:tbl>
          </a:graphicData>
        </a:graphic>
      </p:graphicFrame>`);
  } else if (slide.sections.length >= 2 && slide.sections.length <= 3) {
    // Multi-column Card Layout for distinct sections
    const colCount = slide.sections.length;
    const totalW = 7772400;
    const gap = 228600;
    const colW = Math.floor((totalW - gap * (colCount - 1)) / colCount);

    for (let cIdx = 0; cIdx < colCount; cIdx++) {
      const section = slide.sections[cIdx];
      const colX = 685800 + cIdx * (colW + gap);
      const cardY = 1371600;
      const cardH = 3200400;

      // Card Container Rectangle
      shapes.push(`
        <p:sp>
          <p:nvSpPr>
            <p:cNvPr id="${shapeId++}" name="Card ${cIdx + 1}"/>
            <p:cNvSpPr/>
            <p:nvPr/>
          </p:nvSpPr>
          <p:spPr>
            <a:xfrm>
              <a:off x="${colX}" y="${cardY}"/>
              <a:ext cx="${colW}" cy="${cardH}"/>
            </a:xfrm>
            <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
            <a:solidFill><a:srgbClr val="${cardBg}"/></a:solidFill>
            <a:ln w="12700"><a:solidFill><a:srgbClr val="${cardBorder}"/></a:solidFill></a:ln>
          </p:spPr>
        </p:sp>`);

      // Card Text Content
      const sectionTitleXml = section.heading
        ? `<a:p>
            <a:pPr><a:spcAft><a:spcPts val="1200"/></a:spcAft></a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="1600" b="1">
                <a:solidFill><a:srgbClr val="${titleColor}"/></a:solidFill>
                <a:latin typeface="Calibri"/>
              </a:rPr>
              <a:t xml:space="preserve">${escapeXml(section.heading)}</a:t>
            </a:r>
          </a:p>`
        : '';

      const bulletsXml = section.items
        .map((item) => {
          return `
            <a:p>
              <a:pPr marL="285750" indent="-285750">
                <a:buFont typeface="Arial"/>
                <a:buChar char="•"/>
                <a:spcAft><a:spcPts val="1000"/></a:spcAft>
              </a:pPr>
              <a:r>
                <a:rPr lang="en-US" sz="1300">
                  <a:solidFill><a:srgbClr val="${bodyTextColor}"/></a:solidFill>
                  <a:latin typeface="Calibri"/>
                </a:rPr>
                <a:t xml:space="preserve">${escapeXml(item)}</a:t>
              </a:r>
            </a:p>`;
        })
        .join('');

      shapes.push(`
        <p:sp>
          <p:nvSpPr>
            <p:cNvPr id="${shapeId++}" name="Card Text ${cIdx + 1}"/>
            <p:cNvSpPr txBox="1"/>
            <p:nvPr/>
          </p:nvSpPr>
          <p:spPr>
            <a:xfrm>
              <a:off x="${colX + 182880}" y="${cardY + 182880}"/>
              <a:ext cx="${colW - 365760}" cy="${cardH - 365760}"/>
            </a:xfrm>
            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            <a:noFill/>
          </p:spPr>
          <p:txBody>
            <a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/>
            <a:lstStyle/>
            ${sectionTitleXml}
            ${bulletsXml}
          </p:txBody>
        </p:sp>`);
    }
  } else {
    // Single Expansive Content Card
    const cardX = 685800;
    const cardY = 1371600;
    const cardW = 7772400;
    const cardH = 3200400;

    shapes.push(`
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="${shapeId++}" name="Content Card Background"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="${cardX}" y="${cardY}"/>
            <a:ext cx="${cardW}" cy="${cardH}"/>
          </a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="${cardBg}"/></a:solidFill>
          <a:ln w="12700"><a:solidFill><a:srgbClr val="${cardBorder}"/></a:solidFill></a:ln>
        </p:spPr>
      </p:sp>`);

    const paragraphsXml: string[] = [];

    for (const sec of slide.sections) {
      if (sec.heading) {
        paragraphsXml.push(`
          <a:p>
            <a:pPr><a:spcAft><a:spcPts val="1200"/></a:spcAft></a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="1700" b="1">
                <a:solidFill><a:srgbClr val="${titleColor}"/></a:solidFill>
                <a:latin typeface="Calibri"/>
              </a:rPr>
              <a:t xml:space="preserve">${escapeXml(sec.heading)}</a:t>
            </a:r>
          </a:p>`);
      }

      for (const item of sec.items) {
        paragraphsXml.push(`
          <a:p>
            <a:pPr marL="285750" indent="-285750">
              <a:buFont typeface="Arial"/>
              <a:buChar char="•"/>
              <a:spcAft><a:spcPts val="1200"/></a:spcAft>
            </a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="1500">
                <a:solidFill><a:srgbClr val="${bodyTextColor}"/></a:solidFill>
                <a:latin typeface="Calibri"/>
              </a:rPr>
              <a:t xml:space="preserve">${escapeXml(item)}</a:t>
            </a:r>
          </a:p>`);
      }
    }

    shapes.push(`
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="${shapeId++}" name="Slide Content Text"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="${cardX + 274320}" y="${cardY + 228600}"/>
            <a:ext cx="${cardW - 548640}" cy="${cardH - 457200}"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:lstStyle/>
          ${paragraphsXml.join('\n') || `<a:p><a:r><a:t xml:space="preserve"> </a:t></a:r></a:p>`}
        </p:txBody>
      </p:sp>`);
  }

  // 5. Footer Divider Line
  shapes.push(`
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${shapeId++}" name="Footer Divider"/>
        <p:cNvSpPr/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="685800" y="4680000"/>
          <a:ext cx="7772400" cy="12700"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="${cardBorder}"/></a:solidFill>
        <a:ln><a:noFill/></a:ln>
      </p:spPr>
    </p:sp>`);

  // 6. Footer Placeholder: Doc name (left) + Slide Number (right)
  const cleanDocName = escapeXml(docName.replace(/\.pdf$/i, '').replace(/_/g, ' '));
  shapes.push(`
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${shapeId++}" name="Slide Footer"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="685800" y="4754880"/>
          <a:ext cx="7772400" cy="228600"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/>
        <a:lstStyle/>
        <a:p>
          <a:r>
            <a:rPr lang="en-US" sz="900">
              <a:solidFill><a:srgbClr val="${subtitleColor}"/></a:solidFill>
              <a:latin typeface="Calibri"/>
            </a:rPr>
            <a:t xml:space="preserve">${cleanDocName}  •  Slide ${slideNumber} of ${totalSlides}</a:t>
          </a:r>
        </a:p>
      </p:txBody>
    </p:sp>`);

  return shapes;
}

/**
 * Exact mode block renderer preserving raw PDF bounding boxes with scalable typography
 */
function renderBlockToPptxShape(
  block: TextBlock,
  shapeId: number,
  scaleX: number,
  scaleY: number,
  isDark: boolean
): string {
  const xEmu = Math.round(block.box.x * PT_TO_EMU * scaleX);
  const yEmu = Math.round(block.box.y * PT_TO_EMU * scaleY);
  const wEmu = Math.max(914400, Math.round(block.box.width * PT_TO_EMU * scaleX));
  const hEmu = Math.max(365760, Math.round((block.box.height + 10) * PT_TO_EMU * scaleY));

  const fontSizeHpt = Math.round(Math.max(11, block.fontSize) * 100);
  const isBold = block.isBold || block.type === 'heading1' || block.type === 'heading2';
  const textColor = isDark ? (isBold ? 'FFFFFF' : 'E2E8F0') : isBold ? '0F172A' : '334155';

  const paragraphsXml = block.lines
    .map((line) => {
      const lineText = line.text.trim();
      if (!lineText) return '';

      return `
        <a:p>
          <a:r>
            <a:rPr lang="en-US" sz="${fontSizeHpt}" b="${isBold ? '1' : '0'}" i="${block.isItalic ? '1' : '0'}">
              <a:solidFill>
                <a:srgbClr val="${textColor}"/>
              </a:solidFill>
              <a:latin typeface="Calibri"/>
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
