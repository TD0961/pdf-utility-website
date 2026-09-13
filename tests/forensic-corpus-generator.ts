/**
 * PDFSimplify — Advanced Forensic Compatibility PDF Corpus Generator
 * Creates realistic, complex, edge-case, and adversarial PDF fixtures
 * for rigorous client-side PDF engine verification. Zero backend.
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFName,
  PDFString,
} from 'pdf-lib';

// 2x2 solid red PNG
const SAMPLE_RGBA_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// 1x1 sample JPEG
const SAMPLE_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYMBQUEBQUFBgYHBgYGBggICAgKCgkKCgoKCgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/2wBDARUHBwYGBg4GBg4MDgwODBAMEBAMEBAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AP/Z';

export interface ForensicFixture {
  name: string;
  buffer: ArrayBuffer;
  uint8Array: Uint8Array;
  pageCount: number;
  metadata?: Record<string, string>;
}

/**
 * 1. Two-Column Magazine / Newspaper Layout
 * Essential for testing reading-order vs coordinate interleaving in PDF -> Word / Text
 */
export async function createTwoColumnLayoutFixture(): Promise<ForensicFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595.28, 841.89]); // A4

  // Page Header
  page.drawText('Global Technology Review', {
    x: 50,
    y: 790,
    size: 22,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.2),
  });

  page.drawLine({
    start: { x: 50, y: 775 },
    end: { x: 545, y: 775 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.8),
  });

  // Left Column (X: 50 to 280)
  page.drawText('Section 1: Client Computing', {
    x: 50,
    y: 750,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.3, 0.7),
  });

  const leftLines = [
    'Modern web applications execute complex',
    'cryptographic and document transformations',
    'directly in client-side memory using WebAssembly.',
    'This zero-backend paradigm eliminates cloud',
    'transfer latencies and preserves privacy.',
  ];

  let leftY = 725;
  for (const line of leftLines) {
    page.drawText(line, { x: 50, y: leftY, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    leftY -= 16;
  }

  // Right Column (X: 315 to 545)
  page.drawText('Section 2: Privacy Architecture', {
    x: 315,
    y: 750,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.3, 0.7),
  });

  const rightLines = [
    'By restricting document payloads to local volatile',
    'RAM, confidential business filings and medical',
    'records remain strictly on the user machine.',
    'No remote server logs or third-party tracking',
    'can observe or intercept client document streams.',
  ];

  let rightY = 725;
  for (const line of rightLines) {
    page.drawText(line, { x: 315, y: rightY, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    rightY -= 16;
  }

  const bytes = await doc.save();
  return {
    name: 'two-column-layout.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    uint8Array: bytes,
    pageCount: 1,
  };
}

/**
 * 2. Multi-Language Unicode & Mathematical Symbols
 * Tests font handling, character encodings, and Unicode resilience
 */
export async function createUnicodeMultiLanguageFixture(): Promise<ForensicFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595.28, 841.89]);

  page.drawText('Unicode & International Character Matrix', {
    x: 50,
    y: 790,
    size: 18,
    font: boldFont,
  });

  // Accented Western European Latin
  page.drawText('Latin Accents: Café, façade, résumé, Übergrößenträger, niño, Señora', {
    x: 50,
    y: 740,
    size: 11,
    font,
  });

  // Currency & Math
  page.drawText('Currencies & Math: Total = $1,250.50 | 100 EUR = 105 USD | Delta: +15%', {
    x: 50,
    y: 700,
    size: 11,
    font,
  });

  // Complex symbols
  page.drawText('Symbols: [COPYRIGHT] (C) 2026 PDFSimplify | Section 12-A | Paragraph 4', {
    x: 50,
    y: 660,
    size: 11,
    font,
  });

  // Rotated Text (45 degrees)
  page.drawText('WATERMARK PREVIEW', {
    x: 180,
    y: 400,
    size: 32,
    font: boldFont,
    color: rgb(0.85, 0.85, 0.9),
    rotate: degrees(45),
  });

  const bytes = await doc.save();
  return {
    name: 'unicode-multi-language.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    uint8Array: bytes,
    pageCount: 1,
  };
}

/**
 * 3. Structured Financial Table Grid
 * Essential for verifying PDF to Excel / CSV table detection
 */
export async function createStructuredTableFixture(): Promise<ForensicFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]); // US Letter

  page.drawText('Quarterly Financial Balance Sheet (FY 2026)', {
    x: 50,
    y: 730,
    size: 16,
    font: boldFont,
  });

  // Table Headers
  const colX = [50, 160, 270, 390, 490];
  const headers = ['Account Code', 'Description', 'Q1 Actual', 'Q2 Projected', 'Variance'];

  let currentY = 690;
  for (let c = 0; c < headers.length; c++) {
    page.drawText(headers[c], { x: colX[c], y: currentY, size: 10, font: boldFont, color: rgb(0.1, 0.1, 0.3) });
  }

  page.drawLine({
    start: { x: 50, y: currentY - 5 },
    end: { x: 560, y: currentY - 5 },
    thickness: 1.5,
    color: rgb(0.2, 0.2, 0.4),
  });

  // Table Rows
  const tableRows = [
    ['ACC-1010', 'Cash & Liquid Equivalents', '$4,850,200.00', '$5,100,000.00', '+$249,800.00'],
    ['ACC-1040', 'Accounts Receivable', '$1,920,450.50', '$1,850,000.00', '-$70,450.50'],
    ['ACC-2020', 'Operating Expenses', '$2,310,110.00', '$2,400,000.00', '-$89,890.00'],
    ['ACC-3010', 'Research & Development', '$845,900.25', '$800,000.00', '+$45,900.25'],
    ['ACC-4090', 'Net Operating Income', '$3,614,640.25', '$3,750,000.00', '+$135,359.75'],
  ];

  currentY -= 25;
  for (const row of tableRows) {
    for (let c = 0; c < row.length; c++) {
      page.drawText(row[c], { x: colX[c], y: currentY, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    }
    page.drawLine({
      start: { x: 50, y: currentY - 6 },
      end: { x: 560, y: currentY - 6 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    currentY -= 20;
  }

  const bytes = await doc.save();
  return {
    name: 'structured-table.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    uint8Array: bytes,
    pageCount: 1,
  };
}

/**
 * 4. Image-Heavy Document with Embedded PNG & JPEG XObjects
 */
export async function createMixedImagesFixture(): Promise<ForensicFixture> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 600]);

  // Embed PNG
  const pngRaw = Buffer.from(SAMPLE_RGBA_PNG_BASE64, 'base64');
  const cleanPng = new Uint8Array(pngRaw.buffer.slice(pngRaw.byteOffset, pngRaw.byteOffset + pngRaw.byteLength));
  const pngImage = await doc.embedPng(cleanPng);

  // Embed JPEG
  const jpgRaw = Buffer.from(SAMPLE_JPEG_BASE64, 'base64');
  const cleanJpg = new Uint8Array(jpgRaw.buffer.slice(jpgRaw.byteOffset, jpgRaw.byteOffset + jpgRaw.byteLength));
  const jpgImage = await doc.embedJpg(cleanJpg);

  // Draw PNG at (50, 300)
  page.drawImage(pngImage, { x: 50, y: 300, width: 220, height: 220 });

  // Draw JPEG at (320, 300) rotated by 90 degrees
  page.drawImage(jpgImage, {
    x: 320,
    y: 300,
    width: 220,
    height: 220,
    rotate: degrees(90),
  });

  const bytes = await doc.save();
  return {
    name: 'mixed-images.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    uint8Array: bytes,
    pageCount: 1,
  };
}

/**
 * 5. Mixed-Orientation & Mixed-Geometry Multi-Page Document
 * Page 1: US Letter Portrait with pre-existing /Rotate 90
 * Page 2: A4 Landscape with custom CropBox
 * Page 3: US Legal Portrait with /Rotate 180
 */
export async function createComplexGeometryFixture(): Promise<ForensicFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1: US Letter (612x792) with /Rotate 90
  const p1 = doc.addPage([612, 792]);
  p1.setRotation(degrees(90));
  p1.drawText('Page 1: Letter Portrait Rotated 90°', { x: 100, y: 700, size: 16, font });

  // Page 2: A4 Landscape (841.89x595.28) with CropBox inset by 30pt
  const p2 = doc.addPage([841.89, 595.28]);
  p2.setCropBox(30, 30, 841.89 - 60, 595.28 - 60);
  p2.drawText('Page 2: A4 Landscape with CropBox Inset', { x: 100, y: 500, size: 16, font });

  // Page 3: Legal Portrait (612x1008) with /Rotate 180
  const p3 = doc.addPage([612, 1008]);
  p3.setRotation(degrees(180));
  p3.drawText('Page 3: Legal Portrait Rotated 180°', { x: 100, y: 900, size: 16, font });

  const bytes = await doc.save();
  return {
    name: 'complex-geometry.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    uint8Array: bytes,
    pageCount: 3,
  };
}

/**
 * 6. Interactive AcroForm Document
 * Contains text box, checkbox, radio group, dropdown
 */
export async function createAcroFormFixture(): Promise<ForensicFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);

  page.drawText('Official Client Information Form', { x: 50, y: 730, size: 18, font });

  const form = doc.getForm();

  // 1. Text Field: Full Name
  page.drawText('Full Name:', { x: 50, y: 680, size: 11, font });
  const nameField = form.createTextField('client.fullName');
  nameField.setText('Jane Doe');
  nameField.addToPage(page, { x: 150, y: 670, width: 250, height: 24 });

  // 2. Checkbox: Agree to Terms
  page.drawText('Agree to Terms:', { x: 50, y: 630, size: 11, font });
  const termsBox = form.createCheckBox('client.agreeTerms');
  termsBox.check();
  termsBox.addToPage(page, { x: 150, y: 625, width: 20, height: 20 });

  // 3. Dropdown: Country
  page.drawText('Jurisdiction:', { x: 50, y: 580, size: 11, font });
  const countryDropdown = form.createDropdown('client.jurisdiction');
  countryDropdown.setOptions(['United States', 'European Union', 'United Kingdom', 'Switzerland']);
  countryDropdown.select('European Union');
  countryDropdown.addToPage(page, { x: 150, y: 575, width: 200, height: 24 });

  const bytes = await doc.save();
  return {
    name: 'interactive-acroform.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    uint8Array: bytes,
    pageCount: 1,
  };
}

/**
 * 7. Simulated Dynamic XFA Form Fixture
 * Contains AcroForm with an /XFA dictionary stream to test detection and graceful fallback
 */
export async function createDynamicXfaFixture(): Promise<ForensicFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);

  page.drawText('Government Dynamic XML Form (XFA)', { x: 50, y: 730, size: 18, font });
  page.drawText('Warning: This form uses dynamic Adobe XFA specifications.', { x: 50, y: 690, size: 11, font });

  // Add low-level /XFA key to AcroForm dictionary in PDF catalog
  const catalog = doc.catalog;
  const context = doc.context;

  const acroFormDict = context.obj({
    Fields: context.obj([]),
    XFA: context.obj([
      PDFString.of('template'),
      context.flateStream('<template xmlns="http://www.xfa.org/schema/xfa-template/3.0/"><subform name="form1"/></template>'),
    ]),
  });

  catalog.set(PDFName.of('AcroForm'), acroFormDict);

  const bytes = await doc.save({ useObjectStreams: false });
  // pdf-lib removes /XFA on doc.save(); inject /XFA into the Catalog in the uncompressed stream
  const rawStr = Buffer.from(bytes).toString('latin1');
  const withXfa = rawStr.replace(
    /\/Type\s*\/Catalog/,
    '/Type /Catalog /AcroForm << /XFA [ (template) (<?xml version="1.0"?><template/>) ] >>'
  );
  const finalBytes = new Uint8Array(Buffer.from(withXfa, 'latin1'));

  return {
    name: 'dynamic-xfa.pdf',
    buffer: finalBytes.buffer.slice(finalBytes.byteOffset, finalBytes.byteOffset + finalBytes.byteLength) as ArrayBuffer,
    uint8Array: finalBytes,
    pageCount: 1,
  };
}

/**
 * 8. Pure Scanned Page (No Native Digital Text Layer)
 * Raster image only for testing OCR text layer detection
 */
export async function createScannedImageOnlyFixture(): Promise<ForensicFixture> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);

  // Embed image that represents a scanned document
  const pngRaw = Buffer.from(SAMPLE_RGBA_PNG_BASE64, 'base64');
  const cleanPng = new Uint8Array(pngRaw.buffer.slice(pngRaw.byteOffset, pngRaw.byteOffset + pngRaw.byteLength));
  const pngImage = await doc.embedPng(cleanPng);

  page.drawImage(pngImage, { x: 50, y: 150, width: 500, height: 500 });

  const bytes = await doc.save();
  return {
    name: 'scanned-image-only.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    uint8Array: bytes,
    pageCount: 1,
  };
}

/**
 * 9. Document with PDF Annotations (/Annots)
 * Link annotation, text note annotation, and rectangle annotation
 */
export async function createAnnotatedDocumentFixture(): Promise<ForensicFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);

  page.drawText('Annotated Legal Contract Agreement', { x: 50, y: 730, size: 18, font });
  page.drawText('Review the highlighted terms below:', { x: 50, y: 690, size: 12, font });

  const context = doc.context;

  // Add low-level text annotation (/Subtype /Text)
  const textAnnot = context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Text'),
    Rect: [100, 600, 130, 630],
    Contents: PDFString.of('Reviewer comment: Verify compliance with GDPR Article 28.'),
    Open: false,
  });

  // Add link annotation (/Subtype /Link)
  const linkAnnot = context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Link'),
    Rect: [50, 550, 250, 570],
    A: context.obj({
      Type: PDFName.of('Action'),
      S: PDFName.of('URI'),
      URI: PDFString.of('https://pdfsimplify.com/privacy-policy'),
    }),
  });

  const textAnnotRef = context.register(textAnnot);
  const linkAnnotRef = context.register(linkAnnot);

  const annotsArray = context.obj([textAnnotRef, linkAnnotRef]);
  page.node.set(PDFName.of('Annots'), annotsArray);

  const bytes = await doc.save();
  return {
    name: 'annotated-document.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    uint8Array: bytes,
    pageCount: 1,
  };
}

/**
 * 10. Malformed & Adversarial File Payloads
 */
export function createMalformedPayloads(): {
  truncatedPdf: Uint8Array;
  invalidHeader: Uint8Array;
  scriptInjectedName: string;
  pathTraversalName: string;
  zeroBytes: Uint8Array;
} {
  return {
    truncatedPdf: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a]), // "%PDF-1.7\n" cut off
    invalidHeader: new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x20, 0x20]), // GIF89a
    scriptInjectedName: 'document<script>alert(1)</script>.pdf',
    pathTraversalName: '../../../../etc/shadow.pdf',
    zeroBytes: new Uint8Array(0),
  };
}
