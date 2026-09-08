/**
 * Client-Side PDF Engine using pdf-lib
 * 100% in-browser manipulation: merge, split, rotate, extract, page numbers, watermark, etc.
 */

import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface MergeOptions {
  files: File[];
  onProgress?: (current: number, total: number) => void;
}

export interface SplitOptions {
  file: File;
  ranges: number[][]; // e.g. [[0, 1], [2, 3]] 0-indexed page indices
}

export interface RotateOptions {
  file: File;
  rotations: Record<number, number>; // pageIndex -> rotation degrees (90, 180, 270)
}

export interface LegacyExtractOptions {
  file: File;
  pageIndices: number[]; // 0-indexed
}

export interface LegacyPageNumberOptions {
  file: File;
  position: 'bottom-center' | 'bottom-right' | 'top-right' | 'bottom-left';
  format: 'number-only' | 'page-x-of-y';
  fontSize?: number;
}

export interface WatermarkOptions {
  file: File;
  text: string;
  fontSize?: number;
  opacity?: number;
  color?: { r: number; g: number; b: number };
}

export interface LegacyJpgToPdfOptions {
  images: File[];
  fitToPage?: boolean;
}

/**
 * Merges multiple PDF files into a single PDF
 */
export async function mergePdfs({ files, onProgress }: MergeOptions): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());

    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return await mergedPdf.save();
}

/**
 * Splits a PDF document into separate page groups or single pages
 */
export async function splitPdf({ file, ranges }: SplitOptions): Promise<Uint8Array[]> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const results: Uint8Array[] = [];

  for (const range of ranges) {
    const subDoc = await PDFDocument.create();
    const validIndices = range.filter((idx) => idx >= 0 && idx < sourcePdf.getPageCount());
    const copiedPages = await subDoc.copyPages(sourcePdf, validIndices);

    for (const page of copiedPages) {
      subDoc.addPage(page);
    }

    results.push(await subDoc.save());
  }

  return results;
}

/**
 * Rotates specific pages in a PDF document
 */
export async function rotatePdfPages({ file, rotations }: RotateOptions): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = doc.getPages();

  for (const [pageIdxStr, angle] of Object.entries(rotations)) {
    const idx = parseInt(pageIdxStr, 10);
    if (idx >= 0 && idx < pages.length) {
      const currentRotation = pages[idx].getRotation().angle;
      pages[idx].setRotation(degrees((currentRotation + angle) % 360));
    }
  }

  return await doc.save();
}

/**
 * Extracts selected pages from a PDF into a new PDF (Legacy scaffold)
 */
export async function legacyExtractPdfPages({ file, pageIndices }: LegacyExtractOptions): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const validIndices = pageIndices.filter((idx) => idx >= 0 && idx < sourcePdf.getPageCount());
  const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);

  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  return await newPdf.save();
}

/**
 * Adds page numbering to every page of a PDF document (Legacy scaffold)
 */
export async function legacyAddPageNumbersToPdf({
  file,
  position = 'bottom-center',
  format = 'page-x-of-y',
  fontSize = 10,
}: LegacyPageNumberOptions): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const pageNum = i + 1;
    const label = format === 'page-x-of-y' ? `Page ${pageNum} of ${total}` : `${pageNum}`;
    const textWidth = font.widthOfTextAtSize(label, fontSize);

    let x = width / 2 - textWidth / 2;
    let y = 20;

    if (position === 'bottom-right') {
      x = width - textWidth - 30;
      y = 20;
    } else if (position === 'bottom-left') {
      x = 30;
      y = 20;
    } else if (position === 'top-right') {
      x = width - textWidth - 30;
      y = height - 25;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return await doc.save();
}

/**
 * Adds a diagonal text watermark across every page
 */
export async function addWatermarkToPdf({
  file,
  text,
  fontSize = 48,
  opacity = 0.25,
  color = { r: 0.5, g: 0.5, b: 0.5 },
}: WatermarkOptions): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(45),
    });
  }

  return await doc.save();
}

/**
 * Converts a collection of images (JPG, PNG) into a unified PDF
 */
export async function convertImagesToPdf({ images }: LegacyJpgToPdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const imageFile of images) {
    const bytes = await imageFile.arrayBuffer();
    const isPng = imageFile.type === 'image/png' || imageFile.name.toLowerCase().endsWith('.png');

    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return await doc.save();
}

/**
 * Sanitizes and strips sensitive document metadata (Author, Title, Producer, Keywords)
 */
export async function sanitizePdfMetadata(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('iLikePDF Client-Side Privacy Utility');
  doc.setCreator('iLikePDF (https://ilikepdf.com)');

  return await doc.save();
}
