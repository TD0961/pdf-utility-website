import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { protectPdf } from '@/lib/pdf/protect';
import { isEncrypted } from '@pdfsmaller/pdf-decrypt';
import { createTestPdf, runPopplerPdfInfo, runPopplerPdfToText, isPopplerAvailable } from './test-helpers';
import { getPdfJs } from '@/lib/pdf/pdf-renderer';
import { PDFDocument, degrees } from 'pdf-lib';

describe('Protect PDF Engine', () => {
  it('encrypts a PDF document with user password using AES-256', async () => {
    const pdfFile = await createTestPdf('doc', 3);

    const result = await protectPdf({
      file: pdfFile,
      userPassword: 'UserSecret2026',
    });

    assert.strictEqual(result.totalPages, 3);
    assert.strictEqual(result.fileName, 'doc-protected.pdf');
    assert.strictEqual(result.algorithm, 'AES-256');

    // Confirm with isEncrypted that the output has encryption dictionary
    const encInfo = await isEncrypted(result.uint8Array);
    assert.strictEqual(encInfo.encrypted, true);
    assert.strictEqual(encInfo.algorithm, 'AES-256');
  });

  it('ensures protected output cannot be opened without a password', async () => {
    const pdfFile = await createTestPdf('locked', 2);

    const result = await protectPdf({
      file: pdfFile,
      userPassword: 'StrongPassword123!',
    });

    const pdfjs = await getPdfJs();
    let challengeTriggered = false;

    try {
      const doc = await pdfjs.getDocument({ data: new Uint8Array(result.uint8Array) }).promise;
      // If we get here, try reading page 1 to trigger render challenge
      await doc.getPage(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      if (
        msg.includes('password') ||
        msg.includes('needpassword') ||
        (err as { name?: string })?.name === 'PasswordException'
      ) {
        challengeTriggered = true;
      }
    }

    assert.strictEqual(
      challengeTriggered,
      true,
      'Protected PDF must require a password to open'
    );
  });

  it('authenticates and opens protected PDF when correct password is provided', async () => {
    const pdfFile = await createTestPdf('auth-doc', 2);

    const result = await protectPdf({
      file: pdfFile,
      userPassword: 'MyCorrectPassword',
    });

    const pdfjs = await getPdfJs();
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(result.uint8Array),
      password: 'MyCorrectPassword',
    }).promise;

    assert.strictEqual(doc.numPages, 2);
    const p1 = await doc.getPage(1);
    assert.ok(p1.view.length >= 4);
  });

  it('rejects opening protected PDF when incorrect password is provided', async () => {
    const pdfFile = await createTestPdf('wrong-auth', 1);

    const result = await protectPdf({
      file: pdfFile,
      userPassword: 'ValidPassword',
    });

    const pdfjs = await getPdfJs();
    await assert.rejects(
      async () => {
        const doc = await pdfjs.getDocument({
          data: new Uint8Array(result.uint8Array),
          password: 'IncorrectPassword',
        }).promise;
        await doc.getPage(1);
      },
      /password/i
    );
  });

  it('supports document permission flags', async () => {
    const pdfFile = await createTestPdf('perm-doc', 1);

    const result = await protectPdf({
      file: pdfFile,
      userPassword: 'PasswordWithPerms',
      allowPrinting: true,
      allowCopying: false,
      allowModifying: false,
      allowAnnotating: false,
    });

    assert.strictEqual(result.totalPages, 1);
    const encInfo = await isEncrypted(result.uint8Array);
    assert.strictEqual(encInfo.encrypted, true);
  });

  it('handles documents with mixed page dimensions', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);
    doc.addPage([800, 400]);
    const initialBytes = await doc.save();

    const result = await protectPdf({
      file: { name: 'mixed-dims.pdf', buffer: initialBytes.buffer as ArrayBuffer },
      userPassword: 'MixedSecret',
    });

    assert.strictEqual(result.totalPages, 2);
    const encInfo = await isEncrypted(result.uint8Array);
    assert.strictEqual(encInfo.encrypted, true);
  });

  it('handles documents containing pre-rotated pages', async () => {
    const doc = await PDFDocument.create();
    const p1 = doc.addPage([400, 400]);
    p1.setRotation(degrees(90));
    const initialBytes = await doc.save();

    const result = await protectPdf({
      file: { name: 'rotated.pdf', buffer: initialBytes.buffer as ArrayBuffer },
      userPassword: 'RotatedSecret',
    });

    assert.strictEqual(result.totalPages, 1);
    const encInfo = await isEncrypted(result.uint8Array);
    assert.strictEqual(encInfo.encrypted, true);
  });

  it('rejects empty password with clear validation error', async () => {
    const pdfFile = await createTestPdf('empty-pw', 1);

    await assert.rejects(
      async () => {
        await protectPdf({
          file: pdfFile,
          userPassword: '',
        });
      },
      /enter a password/i
    );
  });

  it('rejects already encrypted PDFs with clear notification', async () => {
    const pdfFile = await createTestPdf('first-pass', 1);
    const firstResult = await protectPdf({
      file: pdfFile,
      userPassword: 'FirstPassword',
    });

    // Attempt to protect the already-protected PDF
    await assert.rejects(
      async () => {
        await protectPdf({
          file: { name: 'already-locked.pdf', buffer: firstResult.uint8Array.buffer as ArrayBuffer },
          userPassword: 'SecondPassword',
        });
      },
      /already protected/i
    );
  });

  it('rejects corrupted non-PDF files', async () => {
    const corrupted = {
      name: 'corrupt.pdf',
      buffer: new TextEncoder().encode('Not a valid PDF').buffer as ArrayBuffer,
    };

    await assert.rejects(
      async () => {
        await protectPdf({
          file: corrupted,
          userPassword: 'Secret',
        });
      },
      /valid PDF/i
    );
  });

  it('respects custom outputFileName', async () => {
    const pdfFile = await createTestPdf('custom-out', 1);

    const result = await protectPdf({
      file: pdfFile,
      userPassword: 'Secret',
      outputFileName: 'secure-vault.pdf',
    });

    assert.strictEqual(result.fileName, 'secure-vault.pdf');
  });

  it('emits sequential progress callbacks (0% to 100%)', async () => {
    const pdfFile = await createTestPdf('progress', 2);
    const progressList: Array<{ pct: number; stage: string }> = [];

    await protectPdf({
      file: pdfFile,
      userPassword: 'Secret',
      onProgress: (_curr, _total, stage, pct) => {
        progressList.push({ pct, stage });
      },
    });

    assert.ok(progressList.length >= 3);
    const last = progressList[progressList.length - 1];
    assert.strictEqual(last.pct, 100);
  });

  it('independent Poppler verification: pdfinfo confirms genuine AES-256 encryption and pdftotext password challenge', async () => {
    if (!isPopplerAvailable()) {
      return; // Skip if Poppler is not installed in environment
    }

    const pdfFile = await createTestPdf('poppler-audit', 3);
    const password = 'PopplerAuditPass2026';

    const result = await protectPdf({
      file: pdfFile,
      userPassword: password,
    });

    // 1. Check with pdfinfo (independent Poppler tool)
    const info = runPopplerPdfInfo(result.uint8Array, password);
    assert.strictEqual(info.isEncrypted, true, 'Poppler must report the document as encrypted');
    assert.strictEqual(info.algorithm, 'AES-256', 'Poppler must detect genuine AES-256 algorithm');

    // 2. pdftotext without password MUST fail
    const unauthenticated = runPopplerPdfToText(result.uint8Array);
    assert.strictEqual(unauthenticated.success, false, 'pdftotext without password must fail');
    assert.ok(
      unauthenticated.error?.includes('password') || unauthenticated.error?.includes('Password'),
      'Poppler error must indicate password requirement'
    );

    // 3. pdftotext with correct user password MUST succeed and extract page content
    const authenticated = runPopplerPdfToText(result.uint8Array, password);
    assert.strictEqual(authenticated.success, true, 'pdftotext with correct password must succeed');
    assert.ok(authenticated.text.includes('poppler-audit - Page 1'));
    assert.ok(authenticated.text.includes('poppler-audit - Page 2'));
    assert.ok(authenticated.text.includes('poppler-audit - Page 3'));
  });

  it('independent Poppler verification: owner password authentication', async () => {
    if (!isPopplerAvailable()) return;

    const pdfFile = await createTestPdf('owner-audit', 1);
    const userPass = 'RegularUserPass';
    const ownerPass = 'AdminOwnerPass';

    const result = await protectPdf({
      file: pdfFile,
      userPassword: userPass,
      ownerPassword: ownerPass,
    });

    // Authenticate using owner password via -opw
    const ownerAccess = runPopplerPdfToText(result.uint8Array, ownerPass, true);
    assert.strictEqual(ownerAccess.success, true, 'Poppler must authenticate with owner password');
    assert.ok(ownerAccess.text.includes('owner-audit - Page 1'));

    // Authenticate using user password via -upw
    const userAccess = runPopplerPdfToText(result.uint8Array, userPass, false);
    assert.strictEqual(userAccess.success, true, 'Poppler must authenticate with user password');
  });

  it('independent Poppler verification: strict permission flag bitmasks', async () => {
    if (!isPopplerAvailable()) return;

    const pdfFile = await createTestPdf('perms-strict', 1);

    // Case 1: All permissions explicitly restricted
    const restrictedResult = await protectPdf({
      file: pdfFile,
      userPassword: 'UserLock',
      allowPrinting: false,
      allowCopying: false,
      allowModifying: false,
      allowAnnotating: false,
    });

    const restrictedInfo = runPopplerPdfInfo(restrictedResult.uint8Array, 'UserLock');
    assert.strictEqual(restrictedInfo.isEncrypted, true);
    assert.ok(
      restrictedInfo.permissions?.includes('print:no') &&
      restrictedInfo.permissions?.includes('copy:no') &&
      restrictedInfo.permissions?.includes('change:no') &&
      restrictedInfo.permissions?.includes('addNotes:no'),
      `Expected all perms to be 'no', got: ${restrictedInfo.permissions}`
    );

    // Case 2: All permissions explicitly granted
    const grantedResult = await protectPdf({
      file: pdfFile,
      userPassword: 'UserLock',
      allowPrinting: true,
      allowCopying: true,
      allowModifying: true,
      allowAnnotating: true,
    });

    const grantedInfo = runPopplerPdfInfo(grantedResult.uint8Array, 'UserLock');
    assert.strictEqual(grantedInfo.isEncrypted, true);
    assert.ok(
      grantedInfo.permissions?.includes('print:yes') &&
      grantedInfo.permissions?.includes('copy:yes') &&
      grantedInfo.permissions?.includes('change:yes') &&
      grantedInfo.permissions?.includes('addNotes:yes'),
      `Expected all perms to be 'yes', got: ${grantedInfo.permissions}`
    );
  });

  it('handles diverse international, accented, and punctuation passwords', async () => {
    const testPasswords = [
      'P@sswørd-ÄÖÜ_2026!',
      'СекретныйПароль123',
      '密码Safe123',
      '  Spaced Out P@ss  ',
      'SuperLongPasswordWithMoreThanSixtyFourCharactersThatIsExtremelyResistantToEntropyCollapse2026!',
    ];

    for (const pwd of testPasswords) {
      const pdfFile = await createTestPdf('pwd-test', 1);
      const result = await protectPdf({
        file: pdfFile,
        userPassword: pwd,
      });

      assert.strictEqual(result.totalPages, 1);
      const encInfo = await isEncrypted(result.uint8Array);
      assert.strictEqual(encInfo.encrypted, true);

      // Verify that all international passwords authenticate successfully with PDF.js
      const pdfjs = await getPdfJs();
      const doc = await pdfjs.getDocument({
        data: new Uint8Array(result.uint8Array),
        password: pwd,
      }).promise;
      assert.strictEqual(doc.numPages, 1);

      // For standard ASCII passwords within standard CLI buffer lengths (<= 32 bytes),
      // cross-verify with independent Poppler CLI. (Poppler CLI has documented quirks with UTF-8 non-ASCII argv)
      const isShortAscii = /^[ -~]{1,32}$/.test(pwd);
      if (isPopplerAvailable() && isShortAscii) {
        const info = runPopplerPdfInfo(result.uint8Array, pwd);
        assert.strictEqual(info.isEncrypted, true);
        assert.strictEqual(info.algorithm, 'AES-256');

        const textRes = runPopplerPdfToText(result.uint8Array, pwd);
        assert.strictEqual(textRes.success, true, `Password '${pwd}' failed in Poppler text extraction`);
      }
    }
  });

  it('protects large 25-page document with consistent geometry and encryption', async () => {
    const pdfFile = await createTestPdf('large-doc', 25);
    const result = await protectPdf({
      file: pdfFile,
      userPassword: 'LargeDocSecret25',
    });

    assert.strictEqual(result.totalPages, 25);
    const encInfo = await isEncrypted(result.uint8Array);
    assert.strictEqual(encInfo.encrypted, true);

    if (isPopplerAvailable()) {
      const info = runPopplerPdfInfo(result.uint8Array, 'LargeDocSecret25');
      assert.strictEqual(info.isEncrypted, true);
      assert.strictEqual(info.pages, 25);
    }
  });
});

