/**
 * PDFSimplify — PDF Metadata Inspection & Removal Engine
 * Inspects standard document metadata properties and securely strips
 * them from the PDF document structure client-side.
 */

import { PDFDocument, PDFName } from 'pdf-lib';
import { assertValidPdfOutput } from './output-validator';
import { CancellationToken } from './conversion/types';

export interface PdfMetadataInfo {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  hasMetadata?: boolean;
}

export interface MetadataRemovalOptions {
  cancellationToken?: CancellationToken;
  removeTitle?: boolean;
  removeAuthor?: boolean;
  removeSubject?: boolean;
  removeKeywords?: boolean;
  removeCreator?: boolean;
  removeProducer?: boolean;
}

export interface MetadataRemovalResult {
  cleanedBytes: Uint8Array;
  originalMetadata: PdfMetadataInfo;
  clearedFieldsCount: number;
  pageCount: number;
  durationMs: number;
}

/**
 * Inspects all standard PDF metadata fields.
 */
export async function inspectPdfMetadata(buffer: ArrayBuffer | Uint8Array): Promise<PdfMetadataInfo> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false });

  const cDate = pdfDoc.getCreationDate();
  const mDate = pdfDoc.getModificationDate();
  const title = pdfDoc.getTitle() || '';
  const author = pdfDoc.getAuthor() || '';
  const subject = pdfDoc.getSubject() || '';
  const keywords = pdfDoc.getKeywords() || '';
  const creator = pdfDoc.getCreator() || '';
  const producer = pdfDoc.getProducer() || '';

  const hasMetadata = Boolean(
    title.trim() ||
    author.trim() ||
    subject.trim() ||
    keywords.trim() ||
    creator.trim() ||
    producer.trim()
  );

  return {
    title,
    author,
    subject,
    keywords,
    creator,
    producer,
    creationDate: cDate ? cDate.toISOString() : undefined,
    modificationDate: mDate ? mDate.toISOString() : undefined,
    hasMetadata,
  };
}

/**
 * Strips supported document metadata fields from the PDF.
 */
export async function removePdfMetadata(
  buffer: ArrayBuffer | Uint8Array,
  options: MetadataRemovalOptions = {}
): Promise<MetadataRemovalResult> {
  const startTime = Date.now();

  if (options.cancellationToken?.isCancelled) {
    throw new Error('Metadata removal cancelled by user.');
  }

  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false });
  const pageCount = pdfDoc.getPageCount();
  const originalMetadata = await inspectPdfMetadata(buffer);

  let clearedFieldsCount = 0;

  // By default, remove all fields unless specifically opted out
  if (options.removeTitle !== false && originalMetadata.title) {
    pdfDoc.setTitle('');
    clearedFieldsCount++;
  }

  if (options.removeAuthor !== false && originalMetadata.author) {
    pdfDoc.setAuthor('');
    clearedFieldsCount++;
  }

  if (options.removeSubject !== false && originalMetadata.subject) {
    pdfDoc.setSubject('');
    clearedFieldsCount++;
  }

  if (options.removeKeywords !== false && originalMetadata.keywords) {
    pdfDoc.setKeywords([]);
    clearedFieldsCount++;
  }

  if (options.removeCreator !== false && originalMetadata.creator) {
    pdfDoc.setCreator('');
    clearedFieldsCount++;
  }

  if (options.removeProducer !== false && originalMetadata.producer) {
    pdfDoc.setProducer('');
    clearedFieldsCount++;
  }

  // Remove XML Metadata stream from document catalog if present
  try {
    const metadataKey = PDFName.of('Metadata');
    if (pdfDoc.catalog.has(metadataKey)) {
      pdfDoc.catalog.delete(metadataKey);
      clearedFieldsCount++;
    }
  } catch {
    // Graceful ignore if stream is not standard
  }

  const cleanedBytes = await pdfDoc.save();

  // Validate output PDF integrity
  await assertValidPdfOutput(cleanedBytes, {
    expectedPages: pageCount,
  });

  return {
    cleanedBytes,
    originalMetadata,
    clearedFieldsCount,
    pageCount,
    durationMs: Date.now() - startTime,
  };
}
