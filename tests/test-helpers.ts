import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Creates a synthetic in-memory PDF document with N pages.
 * Each page has a distinct title text to enable content verification.
 */
export async function createTestPdf(
  label: string,
  pageCount: number
): Promise<{ buffer: ArrayBuffer; name: string }> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([400, 400]);
    page.drawText(`${label} - Page ${i}`, {
      x: 50,
      y: 350,
      size: 24,
      font,
      color: rgb(0, 0, 0),
    });
  }

  const bytes = await doc.save();
  return {
    buffer: bytes.buffer as ArrayBuffer,
    name: `${label}.pdf`,
  };
}export const SAMPLE_JPG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

/**
 * Generates an in-memory valid JPEG byte buffer with specified dimensions.
 */
export function createTestJpgBytes(width = 100, height = 100): Uint8Array {
  const raw = Buffer.from(SAMPLE_JPG_BASE64, 'base64');
  const copy = new Uint8Array(raw.length);
  copy.set(raw);
  const dv = new DataView(copy.buffer);
  dv.setUint16(94, Math.max(1, Math.min(65535, height)));
  dv.setUint16(96, Math.max(1, Math.min(65535, width)));
  return copy;
}

export function createTestJpgFile(name: string, width = 100, height = 100): { buffer: ArrayBuffer; name: string } {
  const bytes = createTestJpgBytes(width, height);
  return {
    buffer: bytes.buffer as ArrayBuffer,
    name,
  };
}

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export function isPopplerAvailable(): boolean {
  try {
    execFileSync('pdfinfo', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function runPopplerPdfInfo(
  pdfBytes: Uint8Array,
  userPassword?: string,
  ownerPassword?: string
): {
  isEncrypted: boolean;
  algorithm?: string;
  permissions?: string;
  pages?: number;
  raw: string;
} {
  const tmpFile = path.join(os.tmpdir(), `test-info-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  try {
    fs.writeFileSync(tmpFile, pdfBytes);
    const args: string[] = [];
    if (userPassword) {
      args.push('-upw', userPassword);
    }
    if (ownerPassword) {
      args.push('-opw', ownerPassword);
    }
    args.push(tmpFile);
    let output = '';
    try {
      output = execFileSync('pdfinfo', args, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err: unknown) {
      const stderr = (err as { stderr?: string | Buffer })?.stderr?.toString() || '';
      if (stderr.includes('Incorrect password') || stderr.includes('password')) {
        return {
          isEncrypted: true,
          algorithm: undefined,
          permissions: undefined,
          pages: undefined,
          raw: stderr,
        };
      }
      throw err;
    }

    const isEnc = /Encrypted:\s+yes/.test(output);
    const matchAlgo = output.match(/algorithm:([a-zA-Z0-9-]+)/);
    const matchPerms = output.match(/Encrypted:\s+yes\s*\(([^)]+)\)/);
    const matchPages = output.match(/Pages:\s+(\d+)/);
    return {
      isEncrypted: isEnc,
      algorithm: matchAlgo ? matchAlgo[1] : undefined,
      permissions: matchPerms ? matchPerms[1] : undefined,
      pages: matchPages ? parseInt(matchPages[1], 10) : undefined,
      raw: output,
    };
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

export function runPopplerPdfToText(
  pdfBytes: Uint8Array,
  password?: string,
  isOwner = false
): {
  success: boolean;
  text: string;
  error?: string;
} {
  const tmpFile = path.join(os.tmpdir(), `test-txt-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  try {
    fs.writeFileSync(tmpFile, pdfBytes);
    const args: string[] = [];
    if (password) {
      args.push(isOwner ? '-opw' : '-upw', password);
    }
    args.push(tmpFile, '-');
    const output = execFileSync('pdftotext', args, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { success: true, text: output };
  } catch (err: unknown) {
    return { success: false, text: '', error: (err as Error).message };
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

