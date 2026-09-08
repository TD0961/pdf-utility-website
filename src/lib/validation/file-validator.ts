import { FileValidationResult } from '@/types/pdf';

// Maximum suggested file size for browser client memory (150MB)
export const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024;
export const WARN_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Validates file object against basic size and empty constraints
 */
export function validateFileBasics(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large for client-side processing (${(file.size / (1024 * 1024)).toFixed(0)}MB). Recommended limit is 150MB to prevent browser tab crashes.`,
    };
  }

  return { valid: true };
}

/**
 * Checks if a file or buffer has valid PDF magic header (%PDF-)
 */
export async function validatePdfMagicBytes(file: File | ArrayBuffer): Promise<FileValidationResult> {
  try {
    let buffer: ArrayBuffer;
    if (file instanceof File) {
      const basic = validateFileBasics(file);
      if (!basic.valid) return basic;
      const slice = file.slice(0, 5);
      buffer = await slice.arrayBuffer();
    } else {
      buffer = file.slice(0, 5);
    }

    const header = new TextDecoder('ascii').decode(buffer);
    if (!header.startsWith('%PDF-')) {
      return {
        valid: false,
        error: 'This file does not appear to be a valid PDF document (missing %PDF signature).',
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Could not read file header. The file may be locked or inaccessible.',
    };
  }
}

/**
 * Validates image files (JPEG, PNG, WebP) for JPG-to-PDF tool
 */
export function validateImageFile(file: File): FileValidationResult {
  const basic = validateFileBasics(file);
  if (!basic.valid) return basic;

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload JPG, PNG, or WebP images.',
    };
  }

  return { valid: true };
}

/**
 * Translates low-level errors into empathetic, actionable user-facing messages.
 * Never leaks raw JavaScript stack traces or internal library exceptions to users.
 */
export function formatUserFacingPdfError(err: unknown, defaultContext = 'operation'): string {
  if (!err) {
    return `We couldn't safely complete this ${defaultContext}. Your original file has not been modified.`;
  }

  const rawMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  // Password / Encryption
  if (
    rawMsg.includes('password') ||
    rawMsg.includes('encrypt') ||
    rawMsg.includes('encryptedpdferror')
  ) {
    return 'This PDF is password protected. Unlock it first, then upload the unlocked copy.';
  }

  // Corrupted / Damaged
  if (
    rawMsg.includes('invalidpdf') ||
    rawMsg.includes('damaged') ||
    rawMsg.includes('corrupt') ||
    rawMsg.includes('xref') ||
    rawMsg.includes('trailer') ||
    rawMsg.includes('unexpected end') ||
    rawMsg.includes('missing data') ||
    rawMsg.includes('bad xref')
  ) {
    return 'This PDF appears to be damaged or malformed. Please try opening it in a PDF reader and saving it again before uploading.';
  }

  // Out of memory / resource pressure
  if (
    rawMsg.includes('memory') ||
    rawMsg.includes('heap') ||
    rawMsg.includes('allocation') ||
    rawMsg.includes('out of bounds') && rawMsg.includes('array')
  ) {
    return 'This PDF is very large and your device may not have enough memory to process it. Try a smaller file or close other browser tabs.';
  }

  // Unsupported structures
  if (
    rawMsg.includes('unsupported') ||
    rawMsg.includes('cannot safely') ||
    rawMsg.includes('proprietary')
  ) {
    return 'This PDF contains features that this browser-based tool cannot safely modify.';
  }

  // Output verification failure
  if (rawMsg.includes('output pdf verification failed') || rawMsg.includes('output zip verification failed')) {
    return (err instanceof Error ? err.message : String(err));
  }

  // User-facing error message that's already crafted cleanly
  if (err instanceof Error && !rawMsg.includes('at ') && !rawMsg.includes('typeerror') && !rawMsg.includes('rangeerror')) {
    return err.message;
  }

  return `We couldn't safely complete this ${defaultContext}. Your original file has not been modified.`;
}

/**
 * Sanitizes a filename for download to prevent unsafe characters or path traversal.
 */
export function sanitizeDownloadFilename(filename: string, fallback = 'document.pdf'): string {
  if (!filename || typeof filename !== 'string') return fallback;

  // Remove path separators and traversal
  let clean = filename
    .replace(/[\\/]/g, '_')
    .replace(/\.\.+/g, '.')
    .replace(/[\x00-\x1f\x80-\x9f<>:"|?*]/g, '')
    .trim();

  // Enforce max length (preserve extension)
  if (clean.length > 80) {
    const extMatch = clean.match(/(\.[a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : '';
    clean = clean.substring(0, 75 - ext.length) + ext;
  }

  return clean || fallback;
}

/**
 * Validates whether a file or buffer has valid JPEG magic bytes (FF D8 FF)
 */
export async function validateJpgMagicBytes(file: File | ArrayBuffer): Promise<FileValidationResult> {
  try {
    let bytes: Uint8Array;
    if (file instanceof File) {
      const basic = validateFileBasics(file);
      if (!basic.valid) return basic;
      const slice = file.slice(0, 3);
      bytes = new Uint8Array(await slice.arrayBuffer());
    } else {
      bytes = new Uint8Array(file.slice(0, 3));
    }

    if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
      return {
        valid: false,
        error: "This file doesn't appear to be a valid JPEG image (missing JPEG signature).",
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Could not read image file header. The file may be inaccessible.',
    };
  }
}

/**
 * Detects whether image buffer is JPEG, PNG, or unknown
 */
export function detectImageType(bytes: Uint8Array): 'jpeg' | 'png' | 'unknown' {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }
  return 'unknown';
}

