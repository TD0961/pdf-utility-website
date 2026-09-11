/**
 * iLikePDF — Client-Side OpenXML XLSX Spreadsheet Builder
 * Generates valid Microsoft Excel (.xlsx) workbooks directly in the browser using JSZip.
 * Reconstructs extracted rows, columns, numbers, and text cells without server APIs.
 */

import JSZip from 'jszip';

export interface XlsxCell {
  value: string | number;
  isNumeric?: boolean;
}

export interface XlsxRow {
  cells: (XlsxCell | string | number | null | undefined)[];
}

export interface XlsxSheetData {
  name: string;
  rows: XlsxRow[];
}

export interface BuildXlsxOptions {
  creator?: string;
  title?: string;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts a 0-indexed column number to Excel column letters (0 -> A, 25 -> Z, 26 -> AA, etc.)
 */
export function colIndexToName(colIdx: number): string {
  let name = '';
  let temp = colIdx;
  while (temp >= 0) {
    name = String.fromCharCode((temp % 26) + 65) + name;
    temp = Math.floor(temp / 26) - 1;
  }
  return name;
}

export async function buildXlsxFromSheets(
  sheets: XlsxSheetData[],
  options: BuildXlsxOptions = {}
): Promise<Uint8Array> {
  const zip = new JSZip();
  const creator = options.creator || 'iLikePDF Client-Side Converter';
  const title = options.title || 'Extracted Table';
  const now = new Date().toISOString();

  const safeSheets = sheets.length > 0 ? sheets : [{ name: 'Sheet1', rows: [] }];

  // 1. [Content_Types].xml
  const sheetOverrides = safeSheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('\n  ');

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheetOverrides}
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
  );

  // 3. xl/_rels/workbook.xml.rels
  const workbookRels = safeSheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .concat([
      `<Relationship Id="rId${safeSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
    ])
    .join('\n  ');

  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRels}
</Relationships>`
  );

  // 4. xl/workbook.xml
  const sheetsXml = safeSheets
    .map(
      (s, i) =>
        `<sheet name="${escapeXml(s.name.slice(0, 31) || `Sheet${i + 1}`)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
    )
    .join('\n    ');

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews>
    <workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/>
  </bookViews>
  <sheets>
    ${sheetsXml}
  </sheets>
</workbook>`
  );

  // 5. xl/styles.xml
  zip.file(
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`
  );

  // 6. Each worksheet: xl/worksheets/sheetN.xml
  safeSheets.forEach((sheetData, sIdx) => {
    const rowsXmlParts: string[] = [];

    sheetData.rows.forEach((row, rIdx) => {
      const rowNum = rIdx + 1;
      const cellsXmlParts: string[] = [];

      row.cells.forEach((cell, cIdx) => {
        if (cell === null || cell === undefined) return;

        const colLetter = colIndexToName(cIdx);
        const cellRef = `${colLetter}${rowNum}`;

        let rawVal: string | number;
        let isNum = false;

        if (typeof cell === 'object' && 'value' in cell) {
          rawVal = cell.value;
          isNum = Boolean(cell.isNumeric);
        } else {
          rawVal = cell;
          if (typeof cell === 'number') {
            isNum = true;
          } else if (typeof cell === 'string' && /^-?\d+(\.\d+)?$/.test(cell.trim()) && cell.trim().length <= 15) {
            // Confident numeric check
            isNum = true;
            rawVal = parseFloat(cell.trim());
          }
        }

        if (isNum && !isNaN(Number(rawVal))) {
          cellsXmlParts.push(`<c r="${cellRef}"><v>${rawVal}</v></c>`);
        } else {
          const strVal = String(rawVal);
          cellsXmlParts.push(
            `<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(strVal)}</t></is></c>`
          );
        }
      });

      if (cellsXmlParts.length > 0) {
        rowsXmlParts.push(`<row r="${rowNum}">${cellsXmlParts.join('')}</row>`);
      }
    });

    const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${rowsXmlParts.join('\n    ')}
  </sheetData>
</worksheet>`;

    zip.file(`xl/worksheets/sheet${sIdx + 1}.xml`, worksheetXml);
  });

  // 7. docProps/core.xml & docProps/app.xml
  zip.file(
    'docProps/core.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>${escapeXml(creator)}</dc:creator>
  <cp:lastModifiedBy>${escapeXml(creator)}</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`
  );

  zip.file(
    'docProps/app.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>iLikePDF Client-Side Converter</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>${safeSheets.length}</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="${safeSheets.length}" baseType="lpstr">${safeSheets.map((s) => `<vt:lpstr>${escapeXml(s.name)}</vt:lpstr>`).join('')}</vt:vector></TitlesOfParts>
  <Company>iLikePDF</Company>
</Properties>`
  );

  return zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
