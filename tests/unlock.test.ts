import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { unlockPdf } from '@/lib/pdf/unlock';
import { protectPdf } from '@/lib/pdf/protect';
import { createTestPdf, runPopplerPdfInfo, runPopplerPdfToText, isPopplerAvailable } from './test-helpers';
import { PDFDocument, degrees } from 'pdf-lib';
import { getPdfJs } from '@/lib/pdf/pdf-renderer';
import { isEncrypted } from '@pdfsmaller/pdf-decrypt';

describe('Unlock PDF Engine', () => {
  it('decrypts a password-protected PDF using the correct password', async () => {
    const originalPdf = await createTestPdf('doc', 3);
    const password = 'UnlockMeSecret123';

    // 1. Protect the document first
    const protectedResult = await protectPdf({
      file: originalPdf,
      userPassword: password,
    });

    // Verify it is genuinely encrypted
    const checkEnc = await isEncrypted(protectedResult.uint8Array);
    assert.strictEqual(checkEnc.encrypted, true);

    // 2. Unlock the document
    const unlockedResult = await unlockPdf({
      file: { name: 'protected-doc.pdf', buffer: protectedResult.uint8Array.buffer as ArrayBuffer },
      password,
    });

    assert.strictEqual(unlockedResult.totalPages, 3);
    assert.strictEqual(unlockedResult.fileName, 'protected-doc-unlocked.pdf');

    // 3. Verify it is genuinely unencrypted
    const checkAfter = await isEncrypted(unlockedResult.uint8Array);
    assert.strictEqual(checkAfter.encrypted, false);

    // Verify loading with pdf-lib directly (which fails on encrypted PDFs)
    const outDoc = await PDFDocument.load(unlockedResult.uint8Array);
    assert.strictEqual(outDoc.isEncrypted, false);
    assert.strictEqual(outDoc.getPageCount(), 3);

    // Verify loading with PDF.js without password
    const pdfjs = await getPdfJs();
    const jsDoc = await pdfjs.getDocument({ data: new Uint8Array(unlockedResult.uint8Array) }).promise;
    assert.strictEqual(jsDoc.numPages, 3);
  });

  it('rejects unlocking when an incorrect password is provided', async () => {
    const originalPdf = await createTestPdf('locked', 1);
    const protectedResult = await protectPdf({
      file: originalPdf,
      userPassword: 'CorrectPassword123',
    });

    await assert.rejects(
      async () => {
        await unlockPdf({
          file: { name: 'locked.pdf', buffer: protectedResult.uint8Array.buffer as ArrayBuffer },
          password: 'WrongPassword456',
        });
      },
      /incorrect password/i
    );
  });

  it('rejects unlocking when document is not encrypted', async () => {
    const unencryptedPdf = await createTestPdf('plain', 2);

    await assert.rejects(
      async () => {
        await unlockPdf({
          file: unencryptedPdf,
          password: 'AnyPassword',
        });
      },
      /not password-protected/i
    );
  });

  it('preserves multi-page documents and page dimensions after unlocking', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([595.28, 841.89]); // A4
    doc.addPage([612, 792]); // Letter
    const initialBytes = await doc.save();

    const protectedResult = await protectPdf({
      file: { name: 'multi-dim.pdf', buffer: initialBytes.buffer as ArrayBuffer },
      userPassword: 'Secret',
    });

    const unlockedResult = await unlockPdf({
      file: { name: 'multi-dim.pdf', buffer: protectedResult.uint8Array.buffer as ArrayBuffer },
      password: 'Secret',
    });

    const outDoc = await PDFDocument.load(unlockedResult.uint8Array);
    assert.strictEqual(outDoc.getPageCount(), 2);
    const p1 = outDoc.getPage(0);
    assert.strictEqual(Math.round(p1.getWidth()), 595);
    assert.strictEqual(Math.round(p1.getHeight()), 842);
  });

  it('preserves documents containing rotated pages after unlocking', async () => {
    const doc = await PDFDocument.create();
    const p1 = doc.addPage([400, 400]);
    p1.setRotation(degrees(90));
    const initialBytes = await doc.save();

    const protectedResult = await protectPdf({
      file: { name: 'rotated.pdf', buffer: initialBytes.buffer as ArrayBuffer },
      userPassword: 'Secret',
    });

    const unlockedResult = await unlockPdf({
      file: { name: 'rotated.pdf', buffer: protectedResult.uint8Array.buffer as ArrayBuffer },
      password: 'Secret',
    });

    const outDoc = await PDFDocument.load(unlockedResult.uint8Array);
    assert.strictEqual(outDoc.getPage(0).getRotation().angle, 90);
  });

  it('rejects empty password with clear validation error', async () => {
    const pdfFile = await createTestPdf('test', 1);

    await assert.rejects(
      async () => {
        await unlockPdf({
          file: pdfFile,
          password: '   ',
        });
      },
      /enter the document password/i
    );
  });

  it('rejects corrupted non-PDF files', async () => {
    const corrupted = {
      name: 'broken.pdf',
      buffer: new TextEncoder().encode('Not a PDF').buffer as ArrayBuffer,
    };

    await assert.rejects(
      async () => {
        await unlockPdf({
          file: corrupted,
          password: 'Secret',
        });
      },
      /valid PDF/i
    );
  });

  it('respects custom outputFileName', async () => {
    const originalPdf = await createTestPdf('doc', 1);
    const protectedResult = await protectPdf({
      file: originalPdf,
      userPassword: 'Secret',
    });

    const unlockedResult = await unlockPdf({
      file: { name: 'doc.pdf', buffer: protectedResult.uint8Array.buffer as ArrayBuffer },
      password: 'Secret',
      outputFileName: 'decrypted-archive.pdf',
    });

    assert.strictEqual(unlockedResult.fileName, 'decrypted-archive.pdf');
  });

  it('emits sequential progress callbacks (0% to 100%)', async () => {
    const originalPdf = await createTestPdf('doc', 1);
    const protectedResult = await protectPdf({
      file: originalPdf,
      userPassword: 'Secret',
    });

    const progressList: Array<{ pct: number; stage: string }> = [];

    await unlockPdf({
      file: { name: 'doc.pdf', buffer: protectedResult.uint8Array.buffer as ArrayBuffer },
      password: 'Secret',
      onProgress: (_curr, _total, stage, pct) => {
        progressList.push({ pct, stage });
      },
    });

    assert.ok(progressList.length >= 3);
    const last = progressList[progressList.length - 1];
    assert.strictEqual(last.pct, 100);
  });

  it('independent Poppler verification: confirms unlocked document has zero encryption and extracts text password-free', async () => {
    if (!isPopplerAvailable()) return;

    const originalPdf = await createTestPdf('poppler-unlock', 2);
    const password = 'PopplerUnlockPass2026';

    const protectedResult = await protectPdf({
      file: originalPdf,
      userPassword: password,
    });

    // Verify it is encrypted in Poppler before unlocking
    const preInfo = runPopplerPdfInfo(protectedResult.uint8Array, password);
    assert.strictEqual(preInfo.isEncrypted, true);

    // Unlock
    const unlockedResult = await unlockPdf({
      file: { name: 'poppler-unlock.pdf', buffer: protectedResult.uint8Array.buffer as ArrayBuffer },
      password,
    });

    // Check with Poppler pdfinfo
    const postInfo = runPopplerPdfInfo(unlockedResult.uint8Array);
    assert.strictEqual(postInfo.isEncrypted, false, 'Poppler must report unlocked document as NOT encrypted');
    assert.strictEqual(postInfo.pages, 2);

    // Check with Poppler pdftotext WITHOUT password
    const textExtraction = runPopplerPdfToText(unlockedResult.uint8Array);
    assert.strictEqual(textExtraction.success, true, 'pdftotext must extract text without password from unlocked PDF');
    assert.ok(textExtraction.text.includes('poppler-unlock - Page 1'));
    assert.ok(textExtraction.text.includes('poppler-unlock - Page 2'));
  });

  it('unlocks document when authenticated using owner password', async () => {
    const originalPdf = await createTestPdf('owner-unlock', 1);
    const userPass = 'UserRestrictedPass';
    const ownerPass = 'MasterAdminPass';

    const protectedResult = await protectPdf({
      file: originalPdf,
      userPassword: userPass,
      ownerPassword: ownerPass,
      allowPrinting: false,
    });

    // Unlock with the owner password
    const unlockedResult = await unlockPdf({
      file: { name: 'owner-unlock.pdf', buffer: protectedResult.uint8Array.buffer as ArrayBuffer },
      password: ownerPass,
    });

    assert.strictEqual(unlockedResult.totalPages, 1);
    const checkAfter = await isEncrypted(unlockedResult.uint8Array);
    assert.strictEqual(checkAfter.encrypted, false);

    if (isPopplerAvailable()) {
      const info = runPopplerPdfInfo(unlockedResult.uint8Array);
      assert.strictEqual(info.isEncrypted, false);
      const textRes = runPopplerPdfToText(unlockedResult.uint8Array);
      assert.strictEqual(textRes.success, true);
      assert.ok(textRes.text.includes('owner-unlock - Page 1'));
    }
  });

  it('unlocks documents protected with Unicode and emoji passwords via SASLprep normalization', async () => {
    const unicodePasswords = [
      'Pass🛡️Word',
      'P@sswørd-ÄÖÜ_2026!',
      'СекретныйПароль123',
      '密码Safe123',
    ];

    for (const pwd of unicodePasswords) {
      const pdfFile = await createTestPdf('unicode-unlock', 1);
      const protectedResult = await protectPdf({
        file: pdfFile,
        userPassword: pwd,
      });

      const unlockedResult = await unlockPdf({
        file: { name: 'unicode-unlock.pdf', buffer: protectedResult.uint8Array.buffer as ArrayBuffer },
        password: pwd,
      });

      assert.strictEqual(unlockedResult.totalPages, 1);
      const checkAfter = await isEncrypted(unlockedResult.uint8Array);
      assert.strictEqual(checkAfter.encrypted, false, `Failed to decrypt with password: ${pwd}`);

      if (isPopplerAvailable()) {
        const postInfo = runPopplerPdfInfo(unlockedResult.uint8Array);
        assert.strictEqual(postInfo.isEncrypted, false);
      }
    }
  });

  it('unlocks large 25-page document and restores all pages password-free', async () => {
    const pdfFile = await createTestPdf('large-unlock', 25);
    const password = 'LargeUnlockPassword25';

    const protectedResult = await protectPdf({
      file: pdfFile,
      userPassword: password,
    });

    const unlockedResult = await unlockPdf({
      file: { name: 'large-unlock.pdf', buffer: protectedResult.uint8Array.buffer as ArrayBuffer },
      password,
    });

    assert.strictEqual(unlockedResult.totalPages, 25);
    const checkAfter = await isEncrypted(unlockedResult.uint8Array);
    assert.strictEqual(checkAfter.encrypted, false);

    const outDoc = await PDFDocument.load(unlockedResult.uint8Array);
    assert.strictEqual(outDoc.getPageCount(), 25);

    if (isPopplerAvailable()) {
      const postInfo = runPopplerPdfInfo(unlockedResult.uint8Array);
      assert.strictEqual(postInfo.isEncrypted, false);
      assert.strictEqual(postInfo.pages, 25);
    }
  });
});

