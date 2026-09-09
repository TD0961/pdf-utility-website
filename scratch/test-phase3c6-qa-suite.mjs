import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { PDFDocument, rgb } from 'pdf-lib';

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Generate multi-page PDF helper
async function generateTestPdf(pages = 3, text = 'Phase 3C.6 Workflow Document') {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([600, 800]);
    page.drawText(`${text} - Page ${i + 1}`, { x: 50, y: 720, size: 20, color: rgb(0.1, 0.2, 0.5) });
    page.drawText(`Confidential Audit Document Page ${i + 1}`, { x: 50, y: 670, size: 14, color: rgb(0.3, 0.3, 0.3) });
  }
  return Buffer.from(await doc.save()).toString('base64');
}

async function runPhase3C6BrowserQa() {
  console.log('=== Phase 3C.6 Comprehensive Browser QA & Validation Suite ===');
  const artifactDir = '/home/tensae/.gemini/antigravity-ide/brain/73117e02-b207-4ffa-aad5-b87fcb55f03d';

  const chromeProcess = spawn('/usr/bin/google-chrome', [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=9225',
    '--window-size=1440,960',
    'http://localhost:3000/pdf-tools/pdf-editor',
  ]);

  await sleep(2500);

  const consoleLogs = [];
  const consoleErrors = [];
  const results = {};

  try {
    const listRes = await fetch('http://127.0.0.1:9225/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found in Chrome');
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
        consoleLogs.push({ type, text });
        if (type === 'error' && !text.includes('favicon') && !text.includes('standardFontDataUrl')) {
          consoleErrors.push(text);
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params.exceptionDetails?.text || 'Uncaught exception';
        consoleErrors.push(text);
      }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((res) => (ws.onopen = res));

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const evalRes = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (evalRes.exceptionDetails) {
        throw new Error(`Eval error: ${evalRes.exceptionDetails.text}`);
      }
      return evalRes.result?.value;
    }

    async function takeScreenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      writeFileSync(`${artifactDir}/${filename}`, buffer);
      console.log(`Saved screenshot: ${artifactDir}/${filename}`);
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    console.log('--- Step 0: Ready Check ---');
    let inputFound = false;
    for (let i = 0; i < 30; i++) {
      const check = await evaluate('Boolean(document.querySelector("input[type=\'file\']"))');
      if (check) {
        inputFound = true;
        break;
      }
      await sleep(300);
    }
    if (!inputFound) throw new Error('Dropzone file input never appeared.');

    console.log('--- Step 1: Loading Synthetic PDF Document ---');
    const pdfBase64 = await generateTestPdf(3, 'Phase 3C.6 Workflow Document');
    await evaluate(`
      (function() {
        const b64 = "${pdfBase64}";
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], "workflow-audit.pdf", { type: "application/pdf" });
        const input = document.querySelector("input[type='file']");
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);

    // Wait for workspace canvas & thumbnails to appear
    let workspaceReady = false;
    for (let i = 0; i < 40; i++) {
      const isReady = await evaluate(`
        Boolean(Array.from(document.querySelectorAll("button")).some(b => b.textContent.includes("Download PDF")))
      `);
      if (isReady) {
        workspaceReady = true;
        break;
      }
      await sleep(250);
    }
    results.workspaceLoaded = workspaceReady;
    console.log('Workspace loaded:', workspaceReady);
    await sleep(1500);

    // Initial Save Status check: initially clean, so no dirty badge
    const initialStatus = await evaluate(`
      (function() {
        const dirty = document.querySelector("[title*='Unsaved changes']");
        return dirty ? 'dirty' : 'clean';
      })()
    `);
    results.initialStatus = initialStatus;
    console.log('Initial Save Status text:', initialStatus);

    console.log('--- Step 2: Keyboard Shortcuts Modal Verification ---');
    // Open shortcuts modal via button click
    const openedShortcuts = await evaluate(`
      (function() {
        const btn = document.querySelector("button[aria-label='Keyboard shortcuts']");
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);
    results.shortcutsBtnClicked = openedShortcuts;
    await sleep(600);

    const shortcutsModalVisible = await evaluate(`
      (function() {
        const modal = document.querySelector("[role='dialog']");
        if (!modal) return false;
        const text = modal.textContent || '';
        return text.includes("Keyboard Shortcuts") && text.includes("Navigation") && text.includes("Workflows");
      })()
    `);
    results.shortcutsModalVisible = shortcutsModalVisible;
    console.log('Shortcuts Modal Verified:', shortcutsModalVisible);
    await takeScreenshot('pdf_editor_phase3c6_shortcuts_modal.png');

    // Close modal via Got it button
    await evaluate(`
      (function() {
        const gotIt = Array.from(document.querySelectorAll("[role='dialog'] button")).find(b => 
          b.textContent.includes("Got it")
        );
        if (gotIt) gotIt.click();
        else {
          const closeBtn = document.querySelector("[role='dialog'] button[aria-label*='Close']");
          if (closeBtn) closeBtn.click();
        }
      })()
    `);
    await sleep(600);

    console.log('--- Step 3: Dirty-State Indicator Transition ---');
    // Rotate pages in thumbnails to cause a deterministic dirty state change
    await evaluate(`
      (function() {
        const selectAllBtn = document.querySelector("button[title*='Select all'], button[title*='Select All']");
        if (selectAllBtn) selectAllBtn.click();
      })()
    `);
    await sleep(400);

    await evaluate(`
      (function() {
        const rotateBtn = document.querySelector("button[title*='Rotate selected'], button[title*='Rotate 90']");
        if (rotateBtn) rotateBtn.click();
      })()
    `);
    await sleep(600);

    // Verify Save status indicator shows Unsaved changes
    const dirtyStatus = await evaluate(`
      (function() {
        const dirtyEl = document.querySelector("[title*='Unsaved changes']");
        if (dirtyEl) return dirtyEl.textContent.trim();
        const bodyText = document.body.textContent || '';
        if (bodyText.includes("Unsaved")) return "Unsaved";
        return "clean";
      })()
    `);
    results.dirtyStatus = dirtyStatus;
    console.log('Dirty Status Indicator:', dirtyStatus);
    await takeScreenshot('pdf_editor_phase3c6_dirty_state.png');

    console.log('--- Step 4: Batch Page Operations in Thumbnails ---');
    const batchBarVisible = await evaluate(`
      (function() {
        const rotateBtn = document.querySelector("button[title*='Rotate selected'], button[title*='Rotate 90']");
        const dupBtn = document.querySelector("button[title*='Duplicate selected']");
        return Boolean(rotateBtn || dupBtn);
      })()
    `);
    results.batchBarVisible = batchBarVisible;
    console.log('Batch Bar Visible:', batchBarVisible);
    await takeScreenshot('pdf_editor_phase3c6_batch_pages.png');

    console.log('--- Step 5: Export Modal Flow & Validation ---');
    // Click Export button in toolbar
    await evaluate(`
      (function() {
        const exportBtn = Array.from(document.querySelectorAll("button")).find(b => 
          b.textContent.includes("Download PDF")
        );
        if (exportBtn) exportBtn.click();
      })()
    `);
    await sleep(600);

    const exportModalVisible = await evaluate(`
      (function() {
        const dialog = document.querySelector("[role='dialog']");
        if (!dialog) return false;
        const text = dialog.textContent || '';
        return text.includes("Export Document") || text.includes("Export & Download");
      })()
    `);
    results.exportModalVisible = exportModalVisible;
    console.log('Export Modal Visible:', exportModalVisible);
    await takeScreenshot('pdf_editor_phase3c6_export_modal.png');

    // Confirm Export execution
    console.log('--- Step 6: Confirm Export & Download ---');
    await evaluate(`
      (function() {
        const dialog = document.querySelector("[role='dialog']");
        if (!dialog) return;
        const confirmBtn = Array.from(dialog.querySelectorAll("button")).find(b => 
          b.textContent.includes("Export & Download")
        );
        if (confirmBtn) confirmBtn.click();
      })()
    `);
    await sleep(2500);

    // Check export success result
    const exportSuccess = await evaluate(`
      (function() {
        const text = document.body.textContent || '';
        return text.includes("Document Export Complete") || 
               text.includes("Export Ready") || 
               text.includes("Download Ready") || 
               Boolean(document.querySelector("a[download]"));
      })()
    `);
    results.exportSuccess = exportSuccess;
    console.log('Export Success State:', exportSuccess);
    await takeScreenshot('pdf_editor_phase3c6_exported_success.png');

    // Print button trigger check
    const printBtnCheck = await evaluate(`
      (function() {
        const printBtn = Array.from(document.querySelectorAll("button")).find(b => 
          b.textContent.includes("Print") || b.title?.includes("Print")
        );
        return Boolean(printBtn);
      })()
    `);
    results.printBtnAvailable = printBtnCheck;
    console.log('Print Action Available:', printBtnCheck);

    console.log('--- Step 7: Console Error Audit ---');
    results.consoleErrorsCount = consoleErrors.length;
    results.consoleErrors = consoleErrors;
    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }

    results.allPassed =
      results.workspaceLoaded &&
      results.shortcutsModalVisible &&
      results.dirtyStatus.includes("Unsaved") &&
      results.batchBarVisible &&
      results.exportModalVisible &&
      results.consoleErrorsCount === 0;

    console.log('=== QA Suite Overall Result ===', results.allPassed ? 'PASSED ✅' : 'FAILED ❌');
    writeFileSync(
      `${artifactDir}/scratch/qa_results_phase3c6.json`,
      JSON.stringify(results, null, 2)
    );
  } catch (err) {
    console.error('QA Suite Error:', err);
  } finally {
    try {
      chromeProcess.kill('SIGKILL');
    } catch {
      // Ignore
    }
  }
}

runPhase3C6BrowserQa();
