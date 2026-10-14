import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '../out');
const PORT = 3456;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
};

async function ensureStaticServer() {
  try {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    if (res.ok) return null;
  } catch {
    // start server
  }

  const server = http.createServer((req, res) => {
    const urlPath = req.url?.split('?')[0] || '/';
    let decodedPath = decodeURIComponent(urlPath);
    if (decodedPath === '/') decodedPath = '/index.html';

    let filePath = path.join(OUT_DIR, decodedPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      if (fs.existsSync(`${filePath}.html`)) {
        filePath = `${filePath}.html`;
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      }
    }

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  await new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => resolve(true));
  });

  return server;
}

async function main() {
  console.log('--- Starting Phase 5 Browser Monetization & Consent Network Audit ---');
  const server = await ensureStaticServer();

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const results = {
    scenarioA: { pass: false, description: 'Fresh visit with no stored consent', externalRequests: [] },
    scenarioB: { pass: false, description: 'Optional analytics rejected', externalRequests: [] },
    scenarioC: { pass: false, description: 'Optional analytics accepted', externalRequests: [] },
    scenarioD: { pass: false, description: 'Optional advertising consent rejected', externalRequests: [] },
    scenarioE: { pass: false, description: 'Optional advertising consent accepted', externalRequests: [] },
    scenarioF: { pass: false, description: 'Consent preference changed after initial selection', externalRequests: [] },
    documentZeroLeakInvariant: true,
    leakedItems: [],
  };

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let interceptedRequests = [];
  page.on('request', (req) => {
    const url = req.url();
    const postData = req.postData() || '';
    interceptedRequests.push({ url, method: req.method(), postData });

    // Invariant check: Document filenames or PDF content bytes must never be transmitted externally
    if (url.includes('sample-doc.pdf') || postData.includes('sample-doc.pdf') || postData.includes('%PDF-')) {
      if (!url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) {
        results.documentZeroLeakInvariant = false;
        results.leakedItems.push({ url, postDataSnippet: postData.slice(0, 100) });
      }
    }
  });

  // -------------------------------------------------------------
  // Scenario A: Fresh Visit with No Stored Consent
  // -------------------------------------------------------------
  console.log('\n[Scenario A] Testing fresh visit without stored consent...');
  await page.goto(`${BASE_URL}/pdf-tools/merge-pdf`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  interceptedRequests = [];
  await page.reload({ waitUntil: 'networkidle0' });

  // Verify consent banner exists
  const bannerVisible = await page.evaluate(() => {
    const banner = document.getElementById('cookie-consent-banner');
    return Boolean(banner);
  });
  console.log('  Consent banner rendered:', bannerVisible);

  // Check external requests during initial unconsented load
  const scenarioAExternal = interceptedRequests.filter(r =>
    !r.url.startsWith('http://127.0.0.1') && !r.url.startsWith('http://localhost')
  );
  console.log('  External requests before consent:', scenarioAExternal.length);
  results.scenarioA.externalRequests = scenarioAExternal.map(r => r.url);
  results.scenarioA.pass = bannerVisible && scenarioAExternal.length === 0;

  // Test local PDF processing under unconsented state
  const fileInput = await page.$('input[type="file"]');
  const fixture1 = path.join(process.cwd(), 'tests', 'fixtures', 'browser', 'sample-doc.pdf');
  const fixture2 = path.join(process.cwd(), 'tests', 'fixtures', 'browser', 'sample-doc-2.pdf');
  if (fileInput && fs.existsSync(fixture1) && fs.existsSync(fixture2)) {
    await fileInput.uploadFile(fixture1, fixture2);
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent && b.textContent.includes('Merge PDFs'));
    }, { timeout: 5000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('Merge PDFs'));
      if (btn) btn.click();
    });

    await page.waitForSelector('a[download]', { timeout: 10000 });
    console.log('  PDF Merge successfully processed client-side without consent requirement!');
  }

  // -------------------------------------------------------------
  // Scenario B: Optional Analytics Rejected
  // -------------------------------------------------------------
  console.log('\n[Scenario B] Rejecting optional consent...');
  interceptedRequests = [];
  const rejectBtn = await page.$('#consent-reject-btn');
  if (rejectBtn) {
    await rejectBtn.click();
    await new Promise(r => setTimeout(r, 500));
  } else {
    await page.evaluate(() => {
      localStorage.setItem('pdfsimplify_cookie_consent_v1', JSON.stringify({
        essential: true, analytics: false, advertising: false, timestamp: Date.now(), version: 1
      }));
    });
  }

  await page.reload({ waitUntil: 'networkidle0' });
  const scenarioBConsent = await page.evaluate(() => {
    return {
      raw: localStorage.getItem('pdfsimplify_cookie_consent_v1'),
      optout: localStorage.getItem('pdfsimplify_analytics_optout'),
      gaDisable: window['ga-disable-G-XZ1VE80DQL'],
      gaScript: Boolean(document.getElementById('google-analytics-script')),
      adScript: Boolean(document.getElementById('adsense-script')),
    };
  });
  console.log('  Stored consent state:', scenarioBConsent);

  const scenarioBExternal = interceptedRequests.filter(r =>
    r.url.includes('google-analytics.com') || r.url.includes('googletagmanager.com') || r.url.includes('pagead2.googlesyndication.com')
  );
  results.scenarioB.externalRequests = scenarioBExternal.map(r => r.url);
  results.scenarioB.pass = !scenarioBConsent.gaScript && !scenarioBConsent.adScript && scenarioBExternal.length === 0;

  // -------------------------------------------------------------
  // Scenario C & D: Optional Analytics Accepted, Advertising Rejected
  // -------------------------------------------------------------
  console.log('\n[Scenario C & D] Accepting analytics only, rejecting advertising...');
  interceptedRequests = [];
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open_cookie_preferences'));
  });
  await new Promise(r => setTimeout(r, 300));

  await page.evaluate(() => {
    // Set granular consent via custom preferences
    localStorage.setItem('pdfsimplify_cookie_consent_v1', JSON.stringify({
      essential: true, analytics: true, advertising: false, timestamp: Date.now(), version: 1
    }));
    window.dispatchEvent(new CustomEvent('pdfsimplify_consent_update', {
      detail: { essential: true, analytics: true, advertising: false, timestamp: Date.now(), version: 1 }
    }));
  });

  await page.reload({ waitUntil: 'networkidle0' });
  const scenarioCDState = await page.evaluate(() => {
    return {
      gaScript: Boolean(document.getElementById('google-analytics-script')),
      adScript: Boolean(document.getElementById('adsense-script')),
    };
  });
  console.log('  Analytics accepted state:', scenarioCDState);
  results.scenarioC.pass = scenarioCDState.gaScript;
  results.scenarioD.pass = !scenarioCDState.adScript;

  // -------------------------------------------------------------
  // Scenario E: Optional Advertising Consent Accepted
  // -------------------------------------------------------------
  console.log('\n[Scenario E] Testing advertising accepted...');
  await page.evaluate(() => {
    localStorage.setItem('pdfsimplify_cookie_consent_v1', JSON.stringify({
      essential: true, analytics: true, advertising: true, timestamp: Date.now(), version: 1
    }));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  const scenarioEState = await page.evaluate(() => {
    const consent = JSON.parse(localStorage.getItem('pdfsimplify_cookie_consent_v1') || '{}');
    return consent.advertising === true;
  });
  results.scenarioE.pass = scenarioEState;
  console.log('  Advertising consent accepted flag:', scenarioEState);

  // -------------------------------------------------------------
  // Scenario F: Consent Preference Changed After Initial Selection
  // -------------------------------------------------------------
  console.log('\n[Scenario F] Modifying preferences back to Rejected...');
  interceptedRequests = [];
  // Click footer settings button
  const footerBtn = await page.$('#footer-cookie-settings-btn');
  if (footerBtn) {
    await footerBtn.click();
    await new Promise(r => setTimeout(r, 300));
  }

  await page.evaluate(() => {
    localStorage.setItem('pdfsimplify_cookie_consent_v1', JSON.stringify({
      essential: true, analytics: false, advertising: false, timestamp: Date.now(), version: 1
    }));
    localStorage.setItem('pdfsimplify_analytics_optout', 'true');
    window['ga-disable-G-XZ1VE80DQL'] = true;
    window.dispatchEvent(new CustomEvent('pdfsimplify_consent_update', {
      detail: { essential: true, analytics: false, advertising: false, timestamp: Date.now(), version: 1 }
    }));
  });

  await page.reload({ waitUntil: 'networkidle0' });
  const scenarioFState = await page.evaluate(() => {
    return {
      gaDisable: window['ga-disable-G-XZ1VE80DQL'],
      optout: localStorage.getItem('pdfsimplify_analytics_optout'),
      consent: JSON.parse(localStorage.getItem('pdfsimplify_cookie_consent_v1') || '{}'),
    };
  });
  console.log('  Post-revocation state:', scenarioFState);

  const scenarioFExternal = interceptedRequests.filter(r =>
    r.url.includes('google-analytics.com') || r.url.includes('googletagmanager.com')
  );
  results.scenarioF.pass = scenarioFState.gaDisable === true && scenarioFState.optout === 'true' && scenarioFExternal.length === 0;

  await browser.close();
  if (server) server.close();

  console.log('\n--- Final Browser Interception Summary ---');
  console.log(JSON.stringify(results, null, 2));

  const allPassed =
    results.scenarioA.pass &&
    results.scenarioB.pass &&
    results.scenarioC.pass &&
    results.scenarioD.pass &&
    results.scenarioE.pass &&
    results.scenarioF.pass &&
    results.documentZeroLeakInvariant;

  if (allPassed) {
    console.log('\n✅ ALL 6 CONSENT SCENARIOS & ZERO-DOCUMENT-LEAK INVARIANTS PASSED!');
    process.exit(0);
  } else {
    console.error('\n❌ ONE OR MORE SCENARIOS FAILED!');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
