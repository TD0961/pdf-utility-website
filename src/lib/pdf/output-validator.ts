/**
 * Output Validation Engine
 * 100% in-browser integrity verification for generated PDF and ZIP outputs.
 * Enforces:
 * 1. Byte array non-emptiness & %PDF- magic signature
 * 2. Successful parsing with pdf-lib
 * 3. Page count matches expected count
 * 4. All pages have valid positive dimensions
 * 5. ZIP package integrity & contained PDF verification
 */

import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export interface ValidatePdfOutputOptions {
  expectedPages?: number;
  minBytes?: number;
  checkDimensions?: boolean;
}

export interface PageDimensionInfo {
  pageIndex: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PdfValidationReport {
  valid: boolean;
  isValid?: boolean;
  error?: string;
  pageCount: number;
  fileSize: number;
  dimensions: PageDimensionInfo[];
}

export interface ZipValidationReport {
  valid: boolean;
  error?: string;
  fileCount: number;
  fileNames: string[];
}

/**
 * Validates generated PDF bytes before returning to the caller or offering download.
 */
export async function validatePdfOutput(
  bytes: Uint8Array,
  options: ValidatePdfOutputOptions = {}
): Promise<PdfValidationReport> {
  const minBytes = options.minBytes ?? 32;

  if (!bytes || bytes.length === 0) {
    return {
      valid: false,
      error: 'Generated PDF output is empty (0 bytes).',
      pageCount: 0,
      fileSize: 0,
      dimensions: [],
    };
  }

  if (bytes.length < minBytes) {
    return {
      valid: false,
      error: `Generated PDF output is suspiciously small (${bytes.length} bytes; expected >= ${minBytes}).`,
      pageCount: 0,
      fileSize: bytes.length,
      dimensions: [],
    };
  }

  // Check magic header (%PDF-)
  const headerSlice = bytes.subarray(0, 5);
  const header = String.fromCharCode(...headerSlice);
  if (!header.startsWith('%PDF-')) {
    return {
      valid: false,
      error: 'Generated output does not start with valid %PDF- header signature.',
      pageCount: 0,
      fileSize: bytes.length,
      dimensions: [],
    };
  }

  // Load and verify structure
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes);
  } catch (err) {
    return {
      valid: false,
      error: `Generated PDF failed structural verification: ${err instanceof Error ? err.message : String(err)}`,
      pageCount: 0,
      fileSize: bytes.length,
      dimensions: [],
    };
  }

  const pageCount = doc.getPageCount();

  if (pageCount === 0) {
    return {
      valid: false,
      error: 'Generated PDF document contains zero pages.',
      pageCount: 0,
      fileSize: bytes.length,
      dimensions: [],
    };
  }

  if (options.expectedPages !== undefined && pageCount !== options.expectedPages) {
    return {
      valid: false,
      error: `Page count mismatch: expected ${options.expectedPages} pages, but generated document has ${pageCount} pages.`,
      pageCount,
      fileSize: bytes.length,
      dimensions: [],
    };
  }

  // Check page dimensions and rotations
  const dimensions: PageDimensionInfo[] = [];
  const pages = doc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const width = page.getWidth();
    const height = page.getHeight();
    const rotation = page.getRotation().angle;

    if (width <= 0 || height <= 0 || Number.isNaN(width) || Number.isNaN(height)) {
      return {
        valid: false,
        error: `Page ${i + 1} has invalid dimensions (${width}x${height}).`,
        pageCount,
        fileSize: bytes.length,
        dimensions: [],
      };
    }

    dimensions.push({
      pageIndex: i,
      width,
      height,
      rotation,
    });
  }

  return {
    valid: true,
    isValid: true,
    pageCount,
    fileSize: bytes.length,
    dimensions,
  };
}

/**
 * Asserts that generated PDF bytes are valid. Throws error if invalid.
 */
export async function assertValidPdfOutput(
  bytes: Uint8Array,
  options: ValidatePdfOutputOptions = {}
): Promise<PdfValidationReport> {
  const report = await validatePdfOutput(bytes, options);
  if (!report.valid) {
    throw new Error(`Output PDF verification failed: ${report.error}`);
  }
  return report;
}

/**
 * Validates a generated ZIP archive and ensures every PDF inside is well-formed.
 */
export async function validateZipOutput(
  blob: Blob | ArrayBuffer | Uint8Array,
  expectedFileCount: number
): Promise<ZipValidationReport> {
  if (!blob) {
    return {
      valid: false,
      error: 'Generated ZIP package is empty.',
      fileCount: 0,
      fileNames: [],
    };
  }

  let zipData: ArrayBuffer | Uint8Array;
  if (typeof Blob !== 'undefined' && blob instanceof Blob) {
    if (blob.size === 0) {
      return {
        valid: false,
        error: 'Generated ZIP package is empty.',
        fileCount: 0,
        fileNames: [],
      };
    }
    zipData = await blob.arrayBuffer();
  } else {
    zipData = blob as ArrayBuffer | Uint8Array;
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipData);
  } catch (err) {
    return {
      valid: false,
      error: `Failed to unpack generated ZIP package: ${err instanceof Error ? err.message : String(err)}`,
      fileCount: 0,
      fileNames: [],
    };
  }

  const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir);

  if (entries.length === 0) {
    return {
      valid: false,
      error: 'Generated ZIP package contains no files.',
      fileCount: 0,
      fileNames: [],
    };
  }

  if (expectedFileCount > 0 && entries.length !== expectedFileCount) {
    return {
      valid: false,
      error: `ZIP entry count mismatch: expected ${expectedFileCount} files, but found ${entries.length}.`,
      fileCount: entries.length,
      fileNames: entries,
    };
  }

  // Validate each PDF inside the ZIP
  for (const fileName of entries) {
    if (fileName.toLowerCase().endsWith('.pdf')) {
      const fileData = await zip.files[fileName].async('uint8array');
      const pdfReport = await validatePdfOutput(fileData, { minBytes: 32 });
      if (!pdfReport.valid) {
        return {
          valid: false,
          error: `Entry "${fileName}" inside ZIP is invalid: ${pdfReport.error}`,
          fileCount: entries.length,
          fileNames: entries,
        };
      }
    }
  }

  return {
    valid: true,
    fileCount: entries.length,
    fileNames: entries,
  };
}

/**
 * Asserts that generated ZIP is valid. Throws error if invalid.
 */
export async function assertValidZipOutput(
  blob: Blob | ArrayBuffer | Uint8Array,
  expectedFileCount: number
): Promise<ZipValidationReport> {
  const report = await validateZipOutput(blob, expectedFileCount);
  if (!report.valid) {
    throw new Error(`Output ZIP verification failed: ${report.error}`);
  }
  return report;
}

export interface JpgValidationReport {
  valid: boolean;
  error?: string;
  byteLength: number;
}

/**
 * Validates generated JPEG bytes (non-empty, >= 32 bytes, FF D8 FF SOI signature)
 */
export function validateJpgOutput(bytes: Uint8Array): JpgValidationReport {
  if (!bytes || bytes.length === 0) {
    return {
      valid: false,
      error: 'Generated JPEG output is empty (0 bytes).',
      byteLength: 0,
    };
  }

  if (bytes.length < 32) {
    return {
      valid: false,
      error: `Generated JPEG output is suspiciously small (${bytes.length} bytes).`,
      byteLength: bytes.length,
    };
  }

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return {
      valid: false,
      error: 'Generated file does not have a valid JPEG header signature (FF D8 FF).',
      byteLength: bytes.length,
    };
  }

  return {
    valid: true,
    byteLength: bytes.length,
  };
}

/**
 * Validates a ZIP archive specifically containing generated JPEG images.
 */
export async function validateZipContainsJpgs(
  blob: Blob | ArrayBuffer | Uint8Array,
  expectedFileCount: number
): Promise<ZipValidationReport> {
  if (!blob) {
    return {
      valid: false,
      error: 'Generated ZIP package is empty.',
      fileCount: 0,
      fileNames: [],
    };
  }

  let zipData: ArrayBuffer | Uint8Array;
  if (typeof Blob !== 'undefined' && blob instanceof Blob) {
    if (blob.size === 0) {
      return {
        valid: false,
        error: 'Generated ZIP package is empty.',
        fileCount: 0,
        fileNames: [],
      };
    }
    zipData = await blob.arrayBuffer();
  } else {
    zipData = blob as ArrayBuffer | Uint8Array;
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipData);
  } catch (err) {
    return {
      valid: false,
      error: `Failed to unpack generated ZIP package: ${err instanceof Error ? err.message : String(err)}`,
      fileCount: 0,
      fileNames: [],
    };
  }

  const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir);

  if (entries.length === 0) {
    return {
      valid: false,
      error: 'Generated ZIP package contains no files.',
      fileCount: 0,
      fileNames: [],
    };
  }

  if (expectedFileCount > 0 && entries.length !== expectedFileCount) {
    return {
      valid: false,
      error: `ZIP entry count mismatch: expected ${expectedFileCount} files, but found ${entries.length}.`,
      fileCount: entries.length,
      fileNames: entries,
    };
  }

  for (const fileName of entries) {
    if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
      const fileData = await zip.files[fileName].async('uint8array');
      const jpgReport = validateJpgOutput(fileData);
      if (!jpgReport.valid) {
        return {
          valid: false,
          error: `Entry "${fileName}" inside ZIP is invalid: ${jpgReport.error}`,
          fileCount: entries.length,
          fileNames: entries,
        };
      }
    }
  }

  return {
    valid: true,
    fileCount: entries.length,
    fileNames: entries,
  };
}

export async function assertValidZipContainsJpgs(
  blob: Blob | ArrayBuffer | Uint8Array,
  expectedFileCount: number
): Promise<ZipValidationReport> {
  const report = await validateZipContainsJpgs(blob, expectedFileCount);
  if (!report.valid) {
    throw new Error(`Output ZIP verification failed: ${report.error}`);
  }
  return report;
}

export interface XlsxValidationReport {
  valid: boolean;
  error?: string;
  byteLength: number;
  hasWorksheet: boolean;
}

/**
 * Validates generated XLSX byte package integrity and OpenXML SpreadsheetML structure.
 */
export async function validateXlsxOutput(
  blobOrBytes: Blob | ArrayBuffer | Uint8Array
): Promise<XlsxValidationReport> {
  let bytes: Uint8Array;
  if (typeof Blob !== 'undefined' && blobOrBytes instanceof Blob) {
    bytes = new Uint8Array(await blobOrBytes.arrayBuffer());
  } else if (blobOrBytes instanceof ArrayBuffer) {
    bytes = new Uint8Array(blobOrBytes);
  } else {
    bytes = blobOrBytes as Uint8Array;
  }

  if (!bytes || bytes.length < 100) {
    return {
      valid: false,
      error: 'Generated Excel file is empty or suspiciously small.',
      byteLength: bytes?.length || 0,
      hasWorksheet: false,
    };
  }

  // Check PK zip magic bytes
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    return {
      valid: false,
      error: 'Generated file does not have valid ZIP/OpenXML header signature.',
      byteLength: bytes.length,
      hasWorksheet: false,
    };
  }

  try {
    const zip = await JSZip.loadAsync(bytes);
    const hasContentTypes = Boolean(zip.file('[Content_Types].xml'));
    const hasWorkbook = Boolean(zip.file('xl/workbook.xml'));
    const hasWorksheet = Boolean(zip.file('xl/worksheets/sheet1.xml'));

    if (!hasContentTypes || !hasWorkbook || !hasWorksheet) {
      return {
        valid: false,
        error: 'Generated XLSX package is missing essential OpenXML parts ([Content_Types], workbook, or worksheet).',
        byteLength: bytes.length,
        hasWorksheet,
      };
    }

    return {
      valid: true,
      byteLength: bytes.length,
      hasWorksheet: true,
    };
  } catch (err) {
    return {
      valid: false,
      error: `Failed to inspect OpenXML spreadsheet package: ${err instanceof Error ? err.message : String(err)}`,
      byteLength: bytes.length,
      hasWorksheet: false,
    };
  }
}

export async function assertValidXlsxOutput(
  blobOrBytes: Blob | ArrayBuffer | Uint8Array
): Promise<XlsxValidationReport> {
  const report = await validateXlsxOutput(blobOrBytes);
  if (!report.valid) {
    throw new Error(`XLSX validation failed: ${report.error}`);
  }
  return report;
}


