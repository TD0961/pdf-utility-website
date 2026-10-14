import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { TOOLS_REGISTRY } from '../src/data/tools';
import { GUIDES_REGISTRY } from '../src/data/guides';

const PORT = 3456;
const BASE_URL = `http://127.0.0.1:${PORT}`;

describe('PDFSimplify — Phase 4 Static Deployment & Route Verification', () => {
  let staticServer: http.Server | null = null;

  before(async () => {
    try {
      const res = await fetch(`${BASE_URL}/robots.txt`);
      if (res.ok) {
        return; // Server is already running
      }
    } catch {
      // Server not running; start local server for static export
    }

    const outDir = path.resolve(process.cwd(), 'out');
    const mimeTypes: Record<string, string> = {
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

    staticServer = http.createServer((req, res) => {
      const urlPath = req.url?.split('?')[0] || '/';
      let decodedPath = decodeURIComponent(urlPath);
      if (decodedPath === '/') decodedPath = '/index.html';

      let filePath = path.join(outDir, decodedPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        if (fs.existsSync(`${filePath}.html`)) {
          filePath = `${filePath}.html`;
        } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
          filePath = path.join(filePath, 'index.html');
        }
      }

      if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
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

    await new Promise<void>((resolve) => {
      staticServer?.listen(PORT, '127.0.0.1', () => {
        resolve();
      });
    });
  });

  after(() => {
    if (staticServer) {
      staticServer.close();
      staticServer = null;
    }
  });
  describe('1. 30 Production Tool Routes (Static Export Resolution)', () => {
    for (const tool of TOOLS_REGISTRY) {
      it(`resolves /pdf-tools/${tool.slug} with 200 OK and valid HTML payload`, async () => {
        const res = await fetch(`${BASE_URL}/pdf-tools/${tool.slug}`);
        assert.strictEqual(res.status, 200, `Expected 200 OK for tool: ${tool.slug}`);

        const html = await res.text();
        assert.ok(html.includes('<!DOCTYPE html>'), 'Must be valid HTML document');
        assert.ok(html.includes(tool.name), `Must contain tool title "${tool.name}"`);
        assert.ok(html.includes('canonical'), 'Must contain canonical link tag');
        assert.ok(html.includes('application/ld+json'), 'Must contain JSON-LD schema');
      });
    }
  });

  describe('2. 30 Educational Guide Routes (Static Export Resolution)', () => {
    for (const guide of GUIDES_REGISTRY) {
      it(`resolves /guides/${guide.slug} with 200 OK and valid HTML payload`, async () => {
        const res = await fetch(`${BASE_URL}/guides/${guide.slug}`);
        assert.strictEqual(res.status, 200, `Expected 200 OK for guide: ${guide.slug}`);

        const html = await res.text();
        assert.ok(html.includes('<!DOCTYPE html>'), 'Must be valid HTML document');
        assert.ok(html.includes(guide.title), `Must contain guide title "${guide.title}"`);
        assert.ok(html.includes('/pdf-tools/'), 'Must include contextual link to tools');
      });
    }
  });

  describe('3. Core Application Routes & Metadata', () => {
    const coreRoutes = [
      '/',
      '/pdf-tools',
      '/guides',
      '/about',
      '/contact',
      '/privacy',
      '/privacy-policy',
      '/security',
      '/terms',
      '/terms-of-service',
      '/cookie-policy',
      '/resources',
    ];

    for (const route of coreRoutes) {
      it(`resolves core route ${route} with 200 OK`, async () => {
        const res = await fetch(`${BASE_URL}${route}`);
        assert.strictEqual(res.status, 200, `Expected 200 OK for ${route}`);
      });
    }
  });

  describe('4. Essential Static Assets, Workers & PWA', () => {
    it('serves synchronized PDF.js worker minified script', async () => {
      const res = await fetch(`${BASE_URL}/pdf.worker.min.mjs`);
      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.ok(text.length > 500000, 'pdf.worker.min.mjs must be full non-empty worker bundle');
    });

    it('serves sitemap.xml with canonical URLs', async () => {
      const res = await fetch(`${BASE_URL}/sitemap.xml`);
      assert.strictEqual(res.status, 200);
      const xml = await res.text();
      assert.ok(xml.includes('<urlset'), 'Must be valid XML urlset');
      assert.ok(xml.includes('https://pdfsimplify.com/pdf-tools/merge-pdf'));
    });

    it('serves robots.txt with disallows and sitemap reference', async () => {
      const res = await fetch(`${BASE_URL}/robots.txt`);
      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes('Sitemap: https://pdfsimplify.com/sitemap.xml'));
    });

    it('serves manifest.webmanifest with valid PWA manifest JSON', async () => {
      const res = await fetch(`${BASE_URL}/manifest.webmanifest`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.ok(json.name.includes('PDFSimplify'), 'Manifest name must include PDFSimplify');
      assert.strictEqual(json.display, 'standalone');
    });

    it('serves og-image.png with valid PNG header bytes', async () => {
      const res = await fetch(`${BASE_URL}/og-image.png`);
      assert.strictEqual(res.status, 200);
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      // PNG header: 89 50 4E 47
      assert.strictEqual(bytes[0], 0x89);
      assert.strictEqual(bytes[1], 0x50);
      assert.strictEqual(bytes[2], 0x4e);
      assert.strictEqual(bytes[3], 0x47);
    });
  });
});
