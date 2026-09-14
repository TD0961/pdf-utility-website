import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import { protectPdf } from '../src/lib/pdf/protect';

export const SAMPLE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAA' +
  'EnQAABJ0Ad5mPtUAAAAiSURBVDhPY/jPwMDwHw0zMDEw0BSMGlA0GFUwbADDAAYGBgYAYLMB/Vb535EAAAAASUVORK5CYII=';

export const SAMPLE_JPG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

export interface TestMatrix {
  basic1Page: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  basic2Page: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  basic5Page: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  basic10Page: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  basic50Page: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  portraitA4: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  landscapeA4: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  letterSize: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  legalSize: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  squareCustom: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  mixedOrientations: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  prerotatedPages: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  multiFontDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  tableDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  imageRasterDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  scannedImageOnlyDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  blankPagesDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  acroformDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  metadataDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  encryptedDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array; password: string };
  corruptedTruncatedDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  renamedNonPdfDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  xssInjectionDoc: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  pathTraversalFile: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
  zeroByteFile: { name: string; buffer: ArrayBuffer; bytes: Uint8Array };
}

export async function generateTestMatrix(): Promise<TestMatrix> {
  // Helper to wrap Uint8Array into file object
  const wrap = (name: string, bytes: Uint8Array) => ({
    name,
    bytes,
    buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  });

  // 1. Basic 1-page A4
  const doc1 = await PDFDocument.create();
  const font1 = await doc1.embedFont(StandardFonts.Helvetica);
  const p1 = doc1.addPage([595.28, 841.89]);
  p1.drawText('Page 1 Single Page Document', { x: 50, y: 750, size: 16, font: font1 });
  p1.drawText('PDFSimplify client-side verification line.', { x: 50, y: 700, size: 12, font: font1 });
  const basic1Bytes = await doc1.save();

  // 2. Basic 2-page
  const doc2 = await PDFDocument.create();
  const font2 = await doc2.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 2; i++) {
    const p = doc2.addPage([595.28, 841.89]);
    p.drawText(`Document Two - Page ${i}`, { x: 50, y: 750, size: 16, font: font2 });
  }
  const basic2Bytes = await doc2.save();

  // 3. Basic 5-page
  const doc5 = await PDFDocument.create();
  const font5 = await doc5.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 5; i++) {
    const p = doc5.addPage([595.28, 841.89]);
    p.drawText(`Five Page Document - Section ${i}`, { x: 50, y: 750, size: 16, font: font5 });
  }
  const basic5Bytes = await doc5.save();

  // 4. Basic 10-page
  const doc10 = await PDFDocument.create();
  const font10 = await doc10.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 10; i++) {
    const p = doc10.addPage([595.28, 841.89]);
    p.drawText(`Ten Page Document - Chapter ${i}`, { x: 50, y: 750, size: 16, font: font10 });
    p.drawText(`Content block for chapter ${i} with text paragraphs for testing.`, { x: 50, y: 700, size: 12, font: font10 });
  }
  const basic10Bytes = await doc10.save();

  // 5. Basic 50-page stress document
  const doc50 = await PDFDocument.create();
  const font50 = await doc50.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 50; i++) {
    const p = doc50.addPage([595.28, 841.89]);
    p.drawText(`Stress Test Document - Page ${i} of 50`, { x: 50, y: 750, size: 14, font: font50 });
  }
  const basic50Bytes = await doc50.save();

  // 6. Portrait A4
  const docPA4 = await PDFDocument.create();
  const fontPA4 = await docPA4.embedFont(StandardFonts.Helvetica);
  const pPA4 = docPA4.addPage([595.28, 841.89]);
  pPA4.drawText('Portrait A4 Dimension', { x: 50, y: 750, size: 18, font: fontPA4 });
  const portraitA4Bytes = await docPA4.save();

  // 7. Landscape A4
  const docLA4 = await PDFDocument.create();
  const fontLA4 = await docLA4.embedFont(StandardFonts.Helvetica);
  const pLA4 = docLA4.addPage([841.89, 595.28]);
  pLA4.drawText('Landscape A4 Dimension', { x: 50, y: 500, size: 18, font: fontLA4 });
  const landscapeA4Bytes = await docLA4.save();

  // 8. Letter Size (612 x 792)
  const docLetter = await PDFDocument.create();
  const fontLetter = await docLetter.embedFont(StandardFonts.Helvetica);
  const pLetter = docLetter.addPage([612, 792]);
  pLetter.drawText('US Letter Dimensions (8.5 x 11 in)', { x: 50, y: 700, size: 16, font: fontLetter });
  const letterBytes = await docLetter.save();

  // 9. Legal Size (612 x 1008)
  const docLegal = await PDFDocument.create();
  const fontLegal = await docLegal.embedFont(StandardFonts.Helvetica);
  const pLegal = docLegal.addPage([612, 1008]);
  pLegal.drawText('US Legal Dimensions (8.5 x 14 in)', { x: 50, y: 900, size: 16, font: fontLegal });
  const legalBytes = await docLegal.save();

  // 10. Square Custom Size (500 x 500)
  const docSquare = await PDFDocument.create();
  const fontSquare = await docSquare.embedFont(StandardFonts.Helvetica);
  const pSquare = docSquare.addPage([500, 500]);
  pSquare.drawText('Square Custom Dimension (500 x 500)', { x: 50, y: 400, size: 16, font: fontSquare });
  const squareBytes = await docSquare.save();

  // 11. Mixed Orientations
  const docMixed = await PDFDocument.create();
  const fontMixed = await docMixed.embedFont(StandardFonts.Helvetica);
  const pM1 = docMixed.addPage([595.28, 841.89]); // portrait
  pM1.drawText('Page 1: Portrait A4', { x: 50, y: 750, size: 16, font: fontMixed });
  const pM2 = docMixed.addPage([841.89, 595.28]); // landscape
  pM2.drawText('Page 2: Landscape A4', { x: 50, y: 500, size: 16, font: fontMixed });
  const mixedBytes = await docMixed.save();

  // 12. Pre-rotated Pages (/Rotate 90, 180, 270)
  const docRot = await PDFDocument.create();
  const fontRot = await docRot.embedFont(StandardFonts.Helvetica);
  const pr1 = docRot.addPage([600, 800]);
  pr1.setRotation(degrees(90));
  pr1.drawText('Pre-rotated 90 degrees', { x: 50, y: 700, size: 16, font: fontRot });
  const pr2 = docRot.addPage([600, 800]);
  pr2.setRotation(degrees(180));
  pr2.drawText('Pre-rotated 180 degrees', { x: 50, y: 700, size: 16, font: fontRot });
  const pr3 = docRot.addPage([600, 800]);
  pr3.setRotation(degrees(270));
  pr3.drawText('Pre-rotated 270 degrees', { x: 50, y: 700, size: 16, font: fontRot });
  const rotatedBytes = await docRot.save();

  // 13. Multi-font Document
  const docFonts = await PDFDocument.create();
  const fHelv = await docFonts.embedFont(StandardFonts.Helvetica);
  const fTimes = await docFonts.embedFont(StandardFonts.TimesRoman);
  const fCour = await docFonts.embedFont(StandardFonts.Courier);
  const fHelvB = await docFonts.embedFont(StandardFonts.HelveticaBold);
  const pf = docFonts.addPage([600, 800]);
  pf.drawText('Helvetica Bold Heading', { x: 50, y: 750, size: 20, font: fHelvB });
  pf.drawText('Times Roman body text paragraph.', { x: 50, y: 700, size: 14, font: fTimes });
  pf.drawText('Courier monospace code line;', { x: 50, y: 660, size: 12, font: fCour });
  pf.drawText('Helvetica standard subtitle.', { x: 50, y: 620, size: 14, font: fHelv });
  const multiFontBytes = await docFonts.save();

  // 14. Structured Table Document
  const docTable = await PDFDocument.create();
  const fontTable = await docTable.embedFont(StandardFonts.Helvetica);
  const pt = docTable.addPage([600, 800]);
  pt.drawText('Quarterly Sales Financial Summary', { x: 50, y: 750, size: 18, font: fontTable });
  // Table Header
  pt.drawText('ID', { x: 50, y: 700, size: 12, font: fontTable });
  pt.drawText('Description', { x: 100, y: 700, size: 12, font: fontTable });
  pt.drawText('Quantity', { x: 300, y: 700, size: 12, font: fontTable });
  pt.drawText('Price', { x: 400, y: 700, size: 12, font: fontTable });
  pt.drawText('Total', { x: 480, y: 700, size: 12, font: fontTable });
  // Row 1
  pt.drawText('101', { x: 50, y: 670, size: 11, font: fontTable });
  pt.drawText('Standard Subscription', { x: 100, y: 670, size: 11, font: fontTable });
  pt.drawText('5', { x: 300, y: 670, size: 11, font: fontTable });
  pt.drawText('$49.00', { x: 400, y: 670, size: 11, font: fontTable });
  pt.drawText('$245.00', { x: 480, y: 670, size: 11, font: fontTable });
  // Row 2 (with empty cell on Quantity)
  pt.drawText('102', { x: 50, y: 640, size: 11, font: fontTable });
  pt.drawText('Enterprise Support', { x: 100, y: 640, size: 11, font: fontTable });
  pt.drawText('-', { x: 300, y: 640, size: 11, font: fontTable });
  pt.drawText('$200.00', { x: 400, y: 640, size: 11, font: fontTable });
  pt.drawText('$200.00', { x: 480, y: 640, size: 11, font: fontTable });
  const tableBytes = await docTable.save();

  // 15. Raster Image Document
  const docImg = await PDFDocument.create();
  const fontImg = await docImg.embedFont(StandardFonts.Helvetica);
  const pngRaw = Buffer.from(SAMPLE_PNG_BASE64, 'base64');
  const pngImg = await docImg.embedPng(pngRaw);
  const pImg = docImg.addPage([600, 600]);
  pImg.drawText('Raster Image Document', { x: 50, y: 550, size: 16, font: fontImg });
  pImg.drawImage(pngImg, { x: 50, y: 300, width: 200, height: 200 });
  const imgBytes = await docImg.save();

  // 16. Scanned Image Only Document
  const docScan = await PDFDocument.create();
  const pngScan = await docScan.embedPng(pngRaw);
  const pScan = docScan.addPage([500, 700]);
  pScan.drawImage(pngScan, { x: 0, y: 0, width: 500, height: 700 });
  const scanBytes = await docScan.save();

  // 17. Blank Pages Document
  const docBlank = await PDFDocument.create();
  const fontBlank = await docBlank.embedFont(StandardFonts.Helvetica);
  const pb1 = docBlank.addPage([500, 700]);
  pb1.drawText('Page 1 Content', { x: 50, y: 600, size: 14, font: fontBlank });
  docBlank.addPage([500, 700]); // Page 2 Blank
  const pb3 = docBlank.addPage([500, 700]);
  pb3.drawText('Page 3 Content', { x: 50, y: 600, size: 14, font: fontBlank });
  const blankBytes = await docBlank.save();

  // 18. AcroForm Document
  const docForm = await PDFDocument.create();
  const fontForm = await docForm.embedFont(StandardFonts.Helvetica);
  const pForm = docForm.addPage([600, 800]);
  pForm.drawText('Interactive User Form', { x: 50, y: 750, size: 18, font: fontForm });
  const form = docForm.getForm();
  const txtField = form.createTextField('fullName');
  txtField.setText('Alice Smith');
  txtField.addToPage(pForm, { x: 50, y: 680, width: 200, height: 24 });

  const chkField = form.createCheckBox('termsAccepted');
  chkField.check();
  chkField.addToPage(pForm, { x: 50, y: 630, width: 20, height: 20 });

  const radioGroup = form.createRadioGroup('subscriptionPlan');
  radioGroup.addOptionToPage('Pro', pForm, { x: 50, y: 580, width: 20, height: 20 });
  radioGroup.select('Pro');
  const formBytes = await docForm.save();

  // 19. Metadata Rich Document
  const docMeta = await PDFDocument.create();
  const fontMeta = await docMeta.embedFont(StandardFonts.Helvetica);
  docMeta.setTitle('Annual Strategy Review 2026');
  docMeta.setAuthor('Security Audit Team');
  docMeta.setSubject('Client-Side Verification');
  docMeta.setKeywords(['audit', 'confidential', 'pdfsimplify', 'iso27001']);
  docMeta.setCreator('PDFSimplify Test Suite');
  docMeta.setProducer('PDFSimplify Producer Engine');
  const pMeta = docMeta.addPage([595.28, 841.89]);
  pMeta.drawText('Confidential Strategy Document with Info Dict', { x: 50, y: 750, size: 16, font: fontMeta });
  const metaBytes = await docMeta.save();

  // 20. Encrypted AES-256 PDF
  const encResult = await protectPdf({
    file: wrap('protected.pdf', basic2Bytes),
    userPassword: 'AuditPassword2026!',
  });
  const encBytes = encResult.uint8Array;

  // 21. Corrupted/Truncated Document
  const corruptBytes = new Uint8Array(150);
  corruptBytes.set(basic1Bytes.slice(0, 80), 0);
  for (let i = 80; i < 150; i++) {
    corruptBytes[i] = 0xff ^ i;
  }

  // 22. Renamed non-PDF file
  const nonPdfBytes = new TextEncoder().encode('This is an ordinary ASCII text file that was renamed to .pdf');

  // 23. XSS Injection in Metadata & Body
  const docXss = await PDFDocument.create();
  docXss.setTitle('<script>alert("XSS Title")</script>');
  docXss.setAuthor('"><img src=x onerror=alert(1)>');
  const pXss = docXss.addPage([600, 800]);
  pXss.drawText('<script>alert("XSS Body")</script>', { x: 50, y: 750, size: 14, font: font1 });
  const xssBytes = await docXss.save();

  // 24. Path Traversal Filename
  const traversalBytes = basic1Bytes;

  // 25. Zero-byte File
  const zeroBytes = new Uint8Array(0);

  return {
    basic1Page: wrap('basic-1page.pdf', basic1Bytes),
    basic2Page: wrap('basic-2page.pdf', basic2Bytes),
    basic5Page: wrap('basic-5page.pdf', basic5Bytes),
    basic10Page: wrap('basic-10page.pdf', basic10Bytes),
    basic50Page: wrap('basic-50page.pdf', basic50Bytes),
    portraitA4: wrap('portrait-a4.pdf', portraitA4Bytes),
    landscapeA4: wrap('landscape-a4.pdf', landscapeA4Bytes),
    letterSize: wrap('letter-size.pdf', letterBytes),
    legalSize: wrap('legal-size.pdf', legalBytes),
    squareCustom: wrap('square-custom.pdf', squareBytes),
    mixedOrientations: wrap('mixed-orientations.pdf', mixedBytes),
    prerotatedPages: wrap('prerotated-pages.pdf', rotatedBytes),
    multiFontDoc: wrap('multi-font.pdf', multiFontBytes),
    tableDoc: wrap('table-document.pdf', tableBytes),
    imageRasterDoc: wrap('image-raster.pdf', imgBytes),
    scannedImageOnlyDoc: wrap('scanned-image-only.pdf', scanBytes),
    blankPagesDoc: wrap('blank-pages.pdf', blankBytes),
    acroformDoc: wrap('acroform-fields.pdf', formBytes),
    metadataDoc: wrap('metadata-rich.pdf', metaBytes),
    encryptedDoc: {
      ...wrap('encrypted-aes256.pdf', encBytes),
      password: 'AuditPassword2026!',
    },
    corruptedTruncatedDoc: wrap('corrupted-truncated.pdf', corruptBytes),
    renamedNonPdfDoc: wrap('renamed-nonpdf.pdf', nonPdfBytes),
    xssInjectionDoc: wrap('xss-injection.pdf', xssBytes),
    pathTraversalFile: wrap('../../../etc/passwd.pdf', traversalBytes),
    zeroByteFile: wrap('empty-zero-bytes.pdf', zeroBytes),
  };
}
