import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

// Valid 16x16 PNG with red and blue pattern (base64)
const SAMPLE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAA' +
  'EnQAABJ0Ad5mPtUAAAAiSURBVDhPY/jPwMDwHw0zMDEw0BSMGlA0GFUwbADDAAYGBgYAYLMB/Vb535EAAAAASUVORK5CYII=';

export interface GeneratedFixture {
  name: string;
  buffer: ArrayBuffer;
  pageCount: number;
}

/**
 * Generates a simple text document (3 pages, standard Helvetica)
 */
export async function createSimpleTextFixture(): Promise<GeneratedFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= 3; i++) {
    const page = doc.addPage([595.28, 841.89]); // A4
    page.drawText(`Document Title — Page ${i}`, {
      x: 50,
      y: 780,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.2, 0.4),
    });
    page.drawText(
      `This is paragraph 1 of page ${i}. PDF processing operates 100% inside client-side browser RAM with zero server uploads.`,
      { x: 50, y: 730, size: 12, font, color: rgb(0.2, 0.2, 0.2) }
    );
    page.drawText(
      `This is paragraph 2 of page ${i}. Standard text vectors, fonts, and dimensions are strictly preserved.`,
      { x: 50, y: 700, size: 12, font, color: rgb(0.3, 0.3, 0.3) }
    );
  }

  const bytes = await doc.save();
  return {
    name: 'simple-text.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    pageCount: 3,
  };
}

/**
 * Generates an image-heavy document with embedded PNG raster assets
 */
export async function createImageHeavyFixture(): Promise<GeneratedFixture> {
  const doc = await PDFDocument.create();
  const pngBytes = Buffer.from(SAMPLE_PNG_BASE64, 'base64');
  const pngImage = await doc.embedPng(pngBytes);

  for (let i = 1; i <= 2; i++) {
    const page = doc.addPage([600, 600]);
    page.drawImage(pngImage, {
      x: 100,
      y: 200,
      width: 200,
      height: 200,
    });
  }

  const bytes = await doc.save();
  return {
    name: 'image-heavy.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    pageCount: 2,
  };
}

/**
 * Generates a mixed-orientation document (Page 1 portrait, Page 2 landscape)
 */
export async function createMixedOrientationFixture(): Promise<GeneratedFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1: Portrait (595x842)
  const p1 = doc.addPage([595.28, 841.89]);
  p1.drawText('Page 1: Portrait (A4)', { x: 50, y: 750, size: 18, font });

  // Page 2: Landscape (842x595)
  const p2 = doc.addPage([841.89, 595.28]);
  p2.drawText('Page 2: Landscape (A4)', { x: 50, y: 500, size: 18, font });

  const bytes = await doc.save();
  return {
    name: 'mixed-orientation.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    pageCount: 2,
  };
}

/**
 * Generates a mixed-page-size document (A4, Letter, Legal)
 */
export async function createMixedPageSizeFixture(): Promise<GeneratedFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // A4: 595.28 x 841.89
  const p1 = doc.addPage([595.28, 841.89]);
  p1.drawText('Page 1: A4 Standard', { x: 50, y: 750, size: 16, font });

  // US Letter: 612 x 792
  const p2 = doc.addPage([612, 792]);
  p2.drawText('Page 2: US Letter', { x: 50, y: 700, size: 16, font });

  // US Legal: 612 x 1008
  const p3 = doc.addPage([612, 1008]);
  p3.drawText('Page 3: US Legal', { x: 50, y: 900, size: 16, font });

  const bytes = await doc.save();
  return {
    name: 'mixed-page-size.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    pageCount: 3,
  };
}

/**
 * Generates a document with pre-existing rotation metadata in /Rotate dictionary tags
 */
export async function createRotatedPagesFixture(): Promise<GeneratedFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1: 0 deg
  const p1 = doc.addPage([500, 500]);
  p1.setRotation(degrees(0));
  p1.drawText('Page 1: Initial 0 deg', { x: 50, y: 400, size: 16, font });

  // Page 2: 90 deg
  const p2 = doc.addPage([500, 500]);
  p2.setRotation(degrees(90));
  p2.drawText('Page 2: Initial 90 deg', { x: 50, y: 400, size: 16, font });

  // Page 3: 180 deg
  const p3 = doc.addPage([500, 500]);
  p3.setRotation(degrees(180));
  p3.drawText('Page 3: Initial 180 deg', { x: 50, y: 400, size: 16, font });

  // Page 4: 270 deg
  const p4 = doc.addPage([500, 500]);
  p4.setRotation(degrees(270));
  p4.drawText('Page 4: Initial 270 deg', { x: 50, y: 400, size: 16, font });

  const bytes = await doc.save();
  return {
    name: 'rotated-pages.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    pageCount: 4,
  };
}

/**
 * Generates a document with Unicode / international text
 */
export async function createUnicodeTextFixture(): Promise<GeneratedFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.addPage([500, 500]);
  page.drawText('English: Client-Side PDF Tools', { x: 40, y: 440, size: 14, font });
  page.drawText('Espanol: Herramientas PDF privadas', { x: 40, y: 400, size: 14, font });
  page.drawText('Francais: Outils PDF securises', { x: 40, y: 360, size: 14, font });
  page.drawText('Deutsch: Lokale PDF-Werkzeuge', { x: 40, y: 320, size: 14, font });

  const bytes = await doc.save();
  return {
    name: 'unicode-text.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    pageCount: 1,
  };
}

/**
 * Generates a document with embedded document metadata
 */
export async function createMetadataFixture(): Promise<GeneratedFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  doc.setTitle('iLikePDF Test Fixture');
  doc.setAuthor('iLikePDF Architecture Team');
  doc.setSubject('Automated Compatibility Verification');
  doc.setKeywords(['client-side', 'pdf-tools', 'zero-backend', 'privacy']);
  doc.setProducer('iLikePDF Engine');
  doc.setCreator('iLikePDF Studio');

  const page = doc.addPage([500, 500]);
  page.drawText('Metadata Test Document', { x: 50, y: 400, size: 18, font });

  const bytes = await doc.save();
  return {
    name: 'metadata.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    pageCount: 1,
  };
}

/**
 * Generates a 100-page document to verify scalability and memory bounds
 */
export async function createLargePageCountFixture(pages = 100): Promise<GeneratedFixture> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([400, 400]);
    page.drawText(`Large Document Page ${i} of ${pages}`, {
      x: 50,
      y: 350,
      size: 16,
      font,
    });
  }

  const bytes = await doc.save();
  return {
    name: 'large-page-count.pdf',
    buffer: bytes.buffer as ArrayBuffer,
    pageCount: pages,
  };
}

/**
 * Writes all fixtures to tests/fixtures/ directory on disk
 */
export async function writeAllFixturesToDisk(targetDir: string): Promise<string[]> {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const generators = [
    createSimpleTextFixture,
    createImageHeavyFixture,
    createMixedOrientationFixture,
    createMixedPageSizeFixture,
    createRotatedPagesFixture,
    createUnicodeTextFixture,
    createMetadataFixture,
  ];

  const filePaths: string[] = [];

  for (const gen of generators) {
    const fixture = await gen();
    const filePath = path.join(targetDir, fixture.name);
    fs.writeFileSync(filePath, Buffer.from(fixture.buffer));
    filePaths.push(filePath);
  }

  // Corrupted fixture
  const corruptedPath = path.join(targetDir, 'corrupted.pdf');
  fs.writeFileSync(corruptedPath, Buffer.from('Not a PDF binary header or trailer'));
  filePaths.push(corruptedPath);

  return filePaths;
}
