/**
 * iLikePDF — Document Inspection & Diagnostics Engine
 * Lightweight, non-intrusive client-side document inspection to detect page geometry,
 * selectable text presence, scanned page conditions, interactive AcroForm fields,
 * and large document memory advisories.
 */

import { PDFDocument } from 'pdf-lib';
import { getPdfJs } from './pdf-renderer';

export interface DocumentDimensions {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape' | 'square';
}

export interface DiagnosticWarning {
  id: string;
  level: 'info' | 'warning';
  title: string;
  message: string;
  recommendedTool?: {
    slug: string;
    name: string;
  };
}

export interface DocumentDiagnostics {
  pageCount: number;
  fileSizeBytes: number;
  dimensions: DocumentDimensions[];
  hasMixedPageSizes: boolean;
  hasSelectableText: boolean;
  isLikelyScanned: boolean;
  hasAcroForm: boolean;
  acroFormFieldCount: number;
  hasMetadata: boolean;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
  };
  warnings: DiagnosticWarning[];
}

/**
 * Inspects a PDF file in browser memory and returns diagnostic intelligence.
 */
export async function inspectPdfDocument(
  fileData: ArrayBuffer | Uint8Array
): Promise<DocumentDiagnostics> {
  const rawBytes = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
  const fileSizeBytes = rawBytes.byteLength;
  const bytes = rawBytes.slice();
  const warnings: DiagnosticWarning[] = [];

  // 1. pdf-lib structural inspection (page dimensions, metadata, AcroForm fields)
  let pageCount = 1;
  const dimensions: DocumentDimensions[] = [];
  let hasMixedPageSizes = false;
  let hasAcroForm = false;
  let acroFormFieldCount = 0;
  const metadata: DocumentDiagnostics['metadata'] = {};

  try {
    const pdfDoc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    pageCount = pdfDoc.getPageCount();

    // Inspect page dimensions
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const width = Math.round(page.getWidth() * 10) / 10;
      const height = Math.round(page.getHeight() * 10) / 10;
      let orientation: 'portrait' | 'landscape' | 'square' = 'portrait';
      if (width > height) orientation = 'landscape';
      else if (Math.abs(width - height) < 2) orientation = 'square';

      dimensions.push({ width, height, orientation });

      if (i > 0) {
        const prev = dimensions[i - 1];
        if (Math.abs(prev.width - width) > 5 || Math.abs(prev.height - height) > 5) {
          hasMixedPageSizes = true;
        }
      }
    }

    // Inspect AcroForm fields
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      acroFormFieldCount = fields.length;
      hasAcroForm = fields.length > 0;
    } catch {
      hasAcroForm = false;
      acroFormFieldCount = 0;
    }

    // Inspect Metadata
    metadata.title = pdfDoc.getTitle() || undefined;
    metadata.author = pdfDoc.getAuthor() || undefined;
    metadata.subject = pdfDoc.getSubject() || undefined;
    metadata.keywords = pdfDoc.getKeywords() || undefined;
    metadata.creator = pdfDoc.getCreator() || undefined;
    metadata.producer = pdfDoc.getProducer() || undefined;
  } catch {
    // If pdf-lib inspection throws (e.g. encrypted), fallback to defaults
  }

  // 2. pdf.js text presence check (sample first 3 pages)
  let hasSelectableText = false;
  let isLikelyScanned = false;

  try {
    const pdfjs = await getPdfJs();
    const loadingTask = pdfjs.getDocument({ data: bytes });
    const doc = await loadingTask.promise;
    const pagesToCheck = Math.min(doc.numPages, 3);
    let totalTextChars = 0;

    for (let p = 1; p <= pagesToCheck; p++) {
      const page = await doc.getPage(p);
      const textContent = await page.getTextContent();
      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string') {
          totalTextChars += item.str.trim().length;
        }
      }
    }

    await doc.cleanup();
    await loadingTask.destroy();

    hasSelectableText = totalTextChars > 20;
    isLikelyScanned = totalTextChars <= 5 && pageCount > 0;
  } catch {
    // Graceful ignore
  }

  // 3. Synthesize diagnostic warnings and recommendations
  if (isLikelyScanned) {
    warnings.push({
      id: 'scanned-doc',
      level: 'warning',
      title: 'Scanned Pages Detected',
      message:
        'This PDF appears to contain scanned or image-based pages without a digital text layer. OCR PDF can extract searchable text.',
      recommendedTool: { slug: 'ocr-pdf', name: 'OCR PDF' },
    });
  }

  if (hasAcroForm) {
    warnings.push({
      id: 'form-fields',
      level: 'info',
      title: 'Interactive Form Fields',
      message: `This document contains ${acroFormFieldCount} interactive form field(s). You can fill or flatten them for tamper-proof sharing.`,
      recommendedTool: { slug: 'flatten-pdf', name: 'Flatten PDF' },
    });
  }

  if (hasMixedPageSizes) {
    warnings.push({
      id: 'mixed-sizes',
      level: 'info',
      title: 'Mixed Page Dimensions',
      message:
        'This document contains pages of varying dimensions. Resize PDF can standardize pages to uniform paper sizes.',
      recommendedTool: { slug: 'resize-pdf', name: 'Resize PDF' },
    });
  }

  if (fileSizeBytes > 30 * 1024 * 1024) {
    const sizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
    warnings.push({
      id: 'large-file',
      level: 'info',
      title: 'Large Document Advisory',
      message: `This file is ${sizeMb} MB. Document processing executes strictly in your browser memory; allow a moment for complex vector calculations.`,
      recommendedTool: { slug: 'compress-pdf', name: 'Compress PDF' },
    });
  }

  const hasMetadata = Object.values(metadata).some((v) => Boolean(v));

  return {
    pageCount,
    fileSizeBytes,
    dimensions,
    hasMixedPageSizes,
    hasSelectableText,
    isLikelyScanned,
    hasAcroForm,
    acroFormFieldCount,
    hasMetadata,
    metadata,
    warnings,
  };
}
