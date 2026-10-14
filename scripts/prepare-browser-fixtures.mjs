import { PDFDocument, StandardFonts } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'tests', 'fixtures', 'browser');
mkdirSync(outDir, { recursive: true });

async function main() {
  // 1. sample-doc.pdf (3 pages)
  const doc1 = await PDFDocument.create();
  const font = await doc1.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) {
    const page = doc1.addPage([595, 842]);
    page.drawText(`PDFSimplify Test Document — Page ${i}`, { x: 50, y: 780, size: 18, font });
    page.drawText(`Page ${i} content for tool processing verification.`, { x: 50, y: 740, size: 12, font });
  }
  const bytes1 = await doc1.save();
  writeFileSync(join(outDir, 'sample-doc.pdf'), bytes1);

  // 2. sample-doc-2.pdf (2 pages)
  const doc2 = await PDFDocument.create();
  for (let i = 1; i <= 2; i++) {
    const page = doc2.addPage([595, 842]);
    page.drawText(`Second Document — Page ${i}`, { x: 50, y: 780, size: 18, font });
  }
  const bytes2 = await doc2.save();
  writeFileSync(join(outDir, 'sample-doc-2.pdf'), bytes2);

  // 3. sample-acroform.pdf
  const formDoc = await PDFDocument.create();
  const formPage = formDoc.addPage([595, 842]);
  formPage.drawText('Interactive Form Document', { x: 50, y: 780, size: 18, font });
  const form = formDoc.getForm();
  const tf = form.createTextField('fullName');
  tf.setText('Jane Doe');
  tf.addToPage(formPage, { x: 50, y: 700, width: 200, height: 25 });
  const cb = form.createCheckBox('agreeTerms');
  cb.check();
  cb.addToPage(formPage, { x: 50, y: 650, width: 20, height: 20 });
  const formBytes = await formDoc.save();
  writeFileSync(join(outDir, 'sample-acroform.pdf'), formBytes);

  // 4. sample-metadata.pdf
  const metaDoc = await PDFDocument.create();
  metaDoc.addPage([595, 842]);
  metaDoc.setTitle('Confidential Financial Report');
  metaDoc.setAuthor('Antigravity QA Engine');
  metaDoc.setSubject('Tool Verification Audit');
  metaDoc.setKeywords(['audit', 'internal', 'security']);
  metaDoc.setProducer('PDFSimplify Test Suite');
  const metaBytes = await metaDoc.save();
  writeFileSync(join(outDir, 'sample-metadata.pdf'), metaBytes);

  // 5. sample-protected.pdf
  const protBytes = await encryptPDF(bytes1, 'AuditSecret123!', {
    ownerPassword: 'MasterAuditSecret123!',
    algorithm: 'AES-256',
    allowPrinting: true,
    allowCopying: false,
    allowModifying: false,
    allowAnnotating: false,
  });
  writeFileSync(join(outDir, 'sample-protected.pdf'), protBytes);

  // 6. sample-image.jpg
  const jpgBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  writeFileSync(join(outDir, 'sample-image.jpg'), Buffer.from(jpgBase64, 'base64'));

  // 7. sample-corrupted.pdf
  writeFileSync(join(outDir, 'sample-corrupted.pdf'), Buffer.from([0x00, 0x11, 0x22, 0x33]));

  console.log('Successfully prepared 7 browser testing fixtures in', outDir);
}

main().catch(console.error);
