/**
 * Dedicated Unlock PDF Engine
 * 100% in-browser PDF password removal and decryption.
 * Uses native Web Crypto API via @pdfsmaller/pdf-decrypt to decrypt protected PDFs.
 * Decrypts ONLY when the user supplies the correct password. Zero password cracking/bypass.
 */

import { decryptPDF, isEncrypted } from '@pdfsmaller/pdf-decrypt';
import { saslPrep } from '@pdfsmaller/pdf-encrypt';
import { validatePdfMagicBytes, sanitizeDownloadFilename } from '@/lib/validation/file-validator';
import { assertValidPdfOutput } from './output-validator';
import { PDFDocument } from 'pdf-lib';
import { getPdfJs } from './pdf-renderer';

export interface UnlockPdfProgressCallback {
  (current: number, total: number, stage: string, percentage: number): void;
}

export interface UnlockPdfOptions {
  file: File | { name: string; buffer: ArrayBuffer };
  password: string;
  outputFileName?: string;
  onProgress?: UnlockPdfProgressCallback;
}

export interface UnlockPdfResult {
  blob: Blob;
  uint8Array: Uint8Array;
  totalPages: number;
  fileSize: number;
  fileName: string;
}

/**
 * Decrypts a password-protected PDF document when supplied with the valid user/owner password.
 */
export async function unlockPdf({
  file,
  password,
  outputFileName,
  onProgress,
}: UnlockPdfOptions): Promise<UnlockPdfResult> {
  if (!password || password.trim().length === 0) {
    throw new Error('Please enter the document password to unlock this PDF.');
  }

  let arrayBuffer: ArrayBuffer;
  let baseFileName = 'document';

  if (file instanceof File) {
    baseFileName = file.name.replace(/\.[^/.]+$/, '');
    const validation = await validatePdfMagicBytes(file);
    if (!validation.valid) {
      throw new Error(`Invalid PDF document. ${validation.error || ''}`);
    }
    arrayBuffer = await file.arrayBuffer();
  } else {
    baseFileName = file.name.replace(/\.[^/.]+$/, '');
    const validation = await validatePdfMagicBytes(file.buffer);
    if (!validation.valid) {
      throw new Error(`Invalid PDF document. ${validation.error || ''}`);
    }
    arrayBuffer = file.buffer;
  }

  onProgress?.(1, 10, 'Inspecting encryption parameters...', 10);

  const inputBytes = new Uint8Array(arrayBuffer);

  // Check if the document is actually encrypted
  const encInfo = await isEncrypted(inputBytes);
  if (!encInfo.encrypted) {
    throw new Error('This PDF is not password-protected and not encrypted. No decryption is required.');
  }

  onProgress?.(3, 10, 'Decrypting document with provided password...', 35);

  let decryptedBytes: Uint8Array;
  try {
    decryptedBytes = await decryptPDF(inputBytes, password);
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (rawMsg.includes('incorrect password') || rawMsg.includes('password')) {
      // Fallback: Check if SASLprep normalization (RFC 4013, e.g. used by AES-256 PDF producers)
      // resolves any variation selector / whitespace discrepancies
      try {
        const prepped = saslPrep(password);
        if (prepped !== password) {
          decryptedBytes = await decryptPDF(inputBytes, prepped);
        } else {
          throw err;
        }
      } catch {
        throw new Error('Incorrect password. Please verify the password and try again.');
      }
    } else if (rawMsg.includes('not encrypted')) {
      throw new Error('This PDF is not password-protected. No decryption is required.');
    } else if (rawMsg.includes('unsupported')) {
      throw new Error(
        'This PDF uses an encryption algorithm that is not supported by this browser-based tool.'
      );
    } else {
      throw new Error(
        `Failed to decrypt PDF: ${err instanceof Error ? err.message : 'Unknown decryption error'}`
      );
    }
  }

  onProgress?.(7, 10, 'Validating decrypted document...', 75);

  // Verify the decrypted output with assertValidPdfOutput
  await assertValidPdfOutput(decryptedBytes);

  // Verify that the decrypted PDF has isEncrypted === false and can be loaded
  let totalPages = 0;
  try {
    const unlockedDoc = await PDFDocument.load(decryptedBytes);
    if (unlockedDoc.isEncrypted) {
      throw new Error('Decryption verification failed: output PDF remains encrypted.');
    }
    totalPages = unlockedDoc.getPageCount();
  } catch (loadErr: unknown) {
    throw new Error(
      `Verification failed on decrypted document: ${
        loadErr instanceof Error ? loadErr.message : String(loadErr)
      }`
    );
  }

  // Double check with PDF.js that it opens without password prompt
  try {
    const pdfjs = await getPdfJs();
    const verifiedTask = pdfjs.getDocument({ data: new Uint8Array(decryptedBytes) });
    try {
      const verifiedDoc = await verifiedTask.promise;
      if (verifiedDoc.numPages !== totalPages) {
        throw new Error('Verification mismatch in page count between parsers.');
      }
      await verifiedDoc.cleanup();
    } finally {
      await verifiedTask.destroy().catch(() => {});
    }
  } catch {
    // PDF.js verification is a secondary check; primary is pdf-lib
  }

  onProgress?.(10, 10, 'Document unlocked successfully!', 100);

  const finalName = sanitizeDownloadFilename(outputFileName || `${baseFileName}-unlocked.pdf`);
  const blob = new Blob([decryptedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  return {
    blob,
    uint8Array: decryptedBytes,
    totalPages,
    fileSize: decryptedBytes.byteLength,
    fileName: finalName,
  };
}
