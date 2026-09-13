import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import manifestGenerator from '../src/app/manifest';

describe('PWA & Manifest Configuration', () => {
  it('generates a valid W3C Web App Manifest matching PWA specifications', () => {
    const manifest = manifestGenerator();

    assert.equal(manifest.name, 'PDFSimplify — Free & Private In-Browser PDF Suite');
    assert.equal(manifest.short_name, 'PDFSimplify');
    assert.equal(manifest.start_url, '/');
    assert.equal(manifest.scope, '/');
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.theme_color, '#4f46e5');
    assert.equal(manifest.background_color, '#0f172a');
    assert.ok(Array.isArray(manifest.categories));
    assert.ok(manifest.categories.includes('productivity'));

    // Verify Icons
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3);
    const has192 = manifest.icons.some((i) => i.sizes === '192x192' && i.src.includes('192'));
    const has512 = manifest.icons.some((i) => i.sizes === '512x512' && i.src.includes('512'));
    const hasMaskable = manifest.icons.some((i) => i.purpose === 'maskable');
    assert.ok(has192, 'Manifest must declare 192x192 icon');
    assert.ok(has512, 'Manifest must declare 512x512 icon');
    assert.ok(hasMaskable, 'Manifest must declare maskable icon for Android adaptive icons');

    // Verify Shortcuts
    assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3);
    const shortcutUrls = manifest.shortcuts.map((s) => s.url);
    assert.ok(shortcutUrls.includes('/pdf-tools/pdf-editor'), 'Shortcut for PDF Editor required');
    assert.ok(shortcutUrls.includes('/pdf-tools/merge-pdf'), 'Shortcut for Merge PDF required');
    assert.ok(shortcutUrls.includes('/pdf-tools/split-pdf'), 'Shortcut for Split PDF required');
  });

  it('verifies public/manifest.json matches generator output', () => {
    const jsonPath = path.resolve('public/manifest.json');
    assert.ok(existsSync(jsonPath), 'public/manifest.json must exist');

    const content = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    assert.equal(content.short_name, 'PDFSimplify');
    assert.equal(content.display, 'standalone');
    assert.equal(content.theme_color, '#4f46e5');
  });
});

describe('Service Worker & Offline Engine', () => {
  it('validates public/sw.js structure and cache rules', () => {
    const swPath = path.resolve('public/sw.js');
    assert.ok(existsSync(swPath), 'public/sw.js must exist');

    const swContent = readFileSync(swPath, 'utf-8');

    // Check Cache Names and Versioning
    assert.match(swContent, /pdfsimplify-static-/);
    assert.match(swContent, /pdfsimplify-runtime-/);

    // Check Pre-cached Assets
    assert.match(swContent, /\/pdf\.worker\.min\.mjs/, 'Critical Mozilla PDF worker must be pre-cached');
    assert.match(swContent, /\/pdf-tools\/merge-pdf/);
    assert.match(swContent, /\/pdf-tools\/pdf-editor/);
    assert.match(swContent, /\/icons\/icon-192\.png/);

    // Check Service Worker Lifecycle Events
    assert.match(swContent, /addEventListener\(['"]install['"]/);
    assert.match(swContent, /addEventListener\(['"]activate['"]/);
    assert.match(swContent, /addEventListener\(['"]fetch['"]/);
    assert.match(swContent, /addEventListener\(['"]message['"]/);

    // Verify Privacy Guards
    assert.match(swContent, /blob:/, 'Must check and ignore blob URLs');
  });
});

describe('Physical Icon Assets Integrity', () => {
  const isPng = (buf: Buffer) => {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  };

  it('verifies icon-192.png is a valid PNG', () => {
    const p = path.resolve('public/icons/icon-192.png');
    assert.ok(existsSync(p));
    const buf = readFileSync(p);
    assert.ok(isPng(buf), 'Must have PNG magic header');
    assert.ok(buf.length > 5000, 'Must have substantial image data');
  });

  it('verifies icon-512.png is a valid PNG', () => {
    const p = path.resolve('public/icons/icon-512.png');
    assert.ok(existsSync(p));
    const buf = readFileSync(p);
    assert.ok(isPng(buf), 'Must have PNG magic header');
    assert.ok(buf.length > 10000, 'Must have substantial image data');
  });

  it('verifies icon-maskable-512.png is a valid PNG', () => {
    const p = path.resolve('public/icons/icon-maskable-512.png');
    assert.ok(existsSync(p));
    const buf = readFileSync(p);
    assert.ok(isPng(buf), 'Must have PNG magic header');
  });

  it('verifies apple-touch-icon.png exists and is valid', () => {
    const p = path.resolve('public/icons/apple-touch-icon.png');
    assert.ok(existsSync(p));
    const buf = readFileSync(p);
    assert.ok(isPng(buf));
  });

  it('verifies favicon.ico exists and is non-empty', () => {
    const p = path.resolve('public/favicon.ico');
    assert.ok(existsSync(p));
    const buf = readFileSync(p);
    assert.ok(buf.length > 500);
  });

  it('verifies vector SVG icon exists and has valid XML/SVG structure', () => {
    const p = path.resolve('src/app/icon.svg');
    assert.ok(existsSync(p));
    const content = readFileSync(p, 'utf-8');
    assert.ok(content.startsWith('<svg'));
    assert.ok(content.includes('viewBox="0 0 512 512"'));
    assert.ok(content.endsWith('</svg>\n') || content.endsWith('</svg>'));
  });
});

describe('Production Deployment Hardening Configuration', () => {
  it('validates public/_headers configuration', () => {
    const headersPath = path.resolve('public/_headers');
    assert.ok(existsSync(headersPath));
    const content = readFileSync(headersPath, 'utf-8');

    assert.match(content, /Content-Security-Policy/);
    assert.match(content, /X-Content-Type-Options:\s*nosniff/);
    assert.match(content, /X-Frame-Options:\s*SAMEORIGIN/);
    assert.match(content, /\/sw\.js[\s\S]*?no-cache/);
    assert.match(content, /\/pdf\.worker\.min\.mjs[\s\S]*?immutable/);
  });

  it('validates vercel.json configuration', () => {
    const vercelPath = path.resolve('vercel.json');
    assert.ok(existsSync(vercelPath));
    const config = JSON.parse(readFileSync(vercelPath, 'utf-8'));

    assert.equal(config.cleanUrls, true);
    assert.ok(Array.isArray(config.headers) && config.headers.length >= 3);
    const swHeader = config.headers.find((h: { source: string }) => h.source === '/sw.js');
    assert.ok(swHeader, 'Must configure no-cache for /sw.js');
  });
});
