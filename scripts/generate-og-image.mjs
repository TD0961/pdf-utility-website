import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    width: 1200px;
    height: 630px;
    background-color: #0c101d;
    background-image:
      radial-gradient(circle at 85% 15%, rgba(99, 102, 241, 0.22) 0%, transparent 45%),
      radial-gradient(circle at 15% 85%, rgba(14, 165, 233, 0.18) 0%, transparent 45%),
      linear-gradient(to bottom, #0c101d, #080c16);
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 64px 80px;
    position: relative;
    overflow: hidden;
  }

  /* Decorative grid lines */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .logo-mark {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #4338ca 0%, #4f46e5 50%, #7c3aed 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.5);
  }

  .brand-name {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #ffffff;
  }
  .brand-name span {
    color: #818cf8;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 9999px;
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(129, 140, 248, 0.3);
    font-size: 13px;
    font-weight: 600;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #a5b4fc;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 10px #34d399;
  }

  .main-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 60px;
    z-index: 10;
    margin-top: 10px;
  }

  .text-side {
    flex: 1;
    max-width: 660px;
  }

  h1 {
    font-size: 52px;
    font-weight: 800;
    line-height: 1.12;
    letter-spacing: -0.03em;
    color: #ffffff;
    margin-bottom: 18px;
  }

  h1 .highlight {
    background: linear-gradient(to right, #ffffff, #c7d2fe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p.description {
    font-size: 20px;
    line-height: 1.5;
    color: #94a3b8;
    margin-bottom: 28px;
    font-weight: 400;
  }

  .features {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .feature-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 14px;
    font-weight: 500;
    color: #cbd5e1;
  }

  .visual-side {
    position: relative;
    width: 320px;
    height: 240px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Stacked Document Cards Motif */
  .doc-card-back {
    position: absolute;
    width: 220px;
    height: 270px;
    background: #1e293b;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transform: rotate(8deg) translate(24px, -10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    opacity: 0.6;
  }

  .doc-card-front {
    position: absolute;
    width: 230px;
    height: 280px;
    background: linear-gradient(145deg, #1e1e2f 0%, #131322 100%);
    border-radius: 14px;
    border: 1px solid rgba(129, 140, 248, 0.35);
    transform: rotate(-3deg);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(99, 102, 241, 0.15);
    padding: 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .doc-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .doc-chip {
    font-size: 11px;
    font-weight: 700;
    font-family: monospace;
    background: #ef4444;
    color: white;
    padding: 3px 8px;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  .doc-badge-priv {
    font-size: 10px;
    font-family: monospace;
    color: #34d399;
  }

  .doc-lines {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 18px 0;
  }

  .doc-line {
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.12);
  }

  .doc-line.w-full { width: 100%; }
  .doc-line.w-4-5 { width: 80%; }
  .doc-line.w-3-4 { width: 75%; }
  .doc-line.w-1-2 { width: 50%; }

  .doc-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 10px;
  }

  .doc-security {
    font-size: 11px;
    color: #94a3b8;
    font-family: monospace;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 20px;
    font-size: 14px;
    color: #64748b;
    z-index: 10;
  }

  .footer-url {
    font-weight: 600;
    color: #94a3b8;
    font-family: ui-monospace, monospace;
    letter-spacing: 0.02em;
  }

  .footer-meta {
    font-family: ui-monospace, monospace;
    font-size: 12px;
  }
</style>
</head>
<body>
  <div class="grid-bg"></div>

  <div class="header">
    <div class="brand">
      <div class="logo-mark">
        <svg width="34" height="34" viewBox="0 0 512 512" fill="none">
          <path d="M120 64 H324 L448 188 V392 C448 423 423 448 392 448 H120 C89 448 64 423 64 392 V120 C64 89 89 64 120 64 Z" stroke="#ffffff" stroke-width="40" stroke-linejoin="round" fill="rgba(255,255,255,0.15)"/>
          <path d="M324 64 V174 C324 182 330 188 338 188 H448 L324 64 Z" fill="#38bdf8" stroke="#ffffff" stroke-width="6" stroke-linejoin="round"/>
          <path d="M324 228 H218 C182 228 156 252 156 282 C156 312 182 332 218 332 H294 C330 332 356 352 356 382 C356 412 330 436 294 436 H188" fill="none" stroke="#ffffff" stroke-width="50" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="324" cy="228" r="26" fill="#38bdf8" stroke="#ffffff" stroke-width="6"/>
          <circle cx="188" cy="436" r="26" fill="#c084fc" stroke="#ffffff" stroke-width="6"/>
        </svg>
      </div>
      <div class="brand-name">PDF<span>Simplify</span></div>
    </div>
    <div class="badge">
      <div class="badge-dot"></div>
      Zero Server Uploads
    </div>
  </div>

  <div class="main-content">
    <div class="text-side">
      <h1><span class="highlight">Free, Fast &amp; Private</span><br>In-Browser PDF Tools</h1>
      <p class="description">
        Merge, split, compress, convert, edit, and sign PDF files directly on your device. Powered by WebAssembly for instant, air-gapped performance.
      </p>
      <div class="features">
        <div class="feature-pill">🔒 100% Client-Side Privacy</div>
        <div class="feature-pill">⚡ Instant Local RAM Processing</div>
        <div class="feature-pill">🛠️ 30+ Free PDF Utilities</div>
      </div>
    </div>

    <div class="visual-side">
      <div class="doc-card-back"></div>
      <div class="doc-card-front">
        <div class="doc-card-header">
          <span class="doc-chip">PDF</span>
          <span class="doc-badge-priv">LOCAL RAM</span>
        </div>
        <div class="doc-lines">
          <div class="doc-line w-full"></div>
          <div class="doc-line w-4-5"></div>
          <div class="doc-line w-3-4"></div>
          <div class="doc-line w-1-2"></div>
        </div>
        <div class="doc-card-footer">
          <span class="doc-security">🔒 WebAssembly</span>
          <span class="doc-security" style="color: #38bdf8;">0 KB Transferred</span>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-url">pdfsimplify.com</div>
    <div class="footer-meta">Client-Side • Privacy-First • No Software Install</div>
  </div>
</body>
</html>`;

const tempHtmlPath = resolve('scratch/og-template.html');
const outputPath = resolve('public/og-image.png');

writeFileSync(tempHtmlPath, htmlContent);

// Render using headless Google Chrome with exact window dimensions 1200x630
const chromeCmd = `google-chrome --headless --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot="${outputPath}" "file://${tempHtmlPath}"`;
console.log('Generating og-image.png via Google Chrome headless...');
execSync(chromeCmd);
console.log(`Successfully generated: ${outputPath}`);
