import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_URL } from '../src/lib/seo/metadata';
import { TOOLS_REGISTRY } from '../src/data/tools';
import { GUIDES_REGISTRY } from '../src/data/guides';

describe('Phase 5: Launch Readiness & Zero-Backend Invariants', () => {
  it('strictly enforces zero backend API routes', () => {
    const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
    const apiExists = fs.existsSync(apiDir);
    if (apiExists) {
      const files = fs.readdirSync(apiDir);
      assert.equal(files.length, 0);
    } else {
      assert.equal(apiExists, false);
    }
  });

  it('uses canonical production domain https://ilikepdf.com', () => {
    assert.equal(SITE_URL, 'https://ilikepdf.com');
  });

  it('verifies next.config.ts enforces static export', () => {
    const configPath = path.join(process.cwd(), 'next.config.ts');
    const content = fs.readFileSync(configPath, 'utf8');
    assert.match(content, /output:\s*['"]export['"]/);
  });

  it('verifies manifest and sitemap are force-static for export compliance', () => {
    const sitemapPath = path.join(process.cwd(), 'src', 'app', 'sitemap.ts');
    const manifestPath = path.join(process.cwd(), 'src', 'app', 'manifest.ts');

    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');

    assert.ok(sitemapContent.includes("export const dynamic = 'force-static'"));
    assert.ok(manifestContent.includes("export const dynamic = 'force-static'"));
  });

  it('has complete reciprocal tool-guide coverage across all 30 tools and 24 guides', () => {
    const toolSlugs = new Set(TOOLS_REGISTRY.map((t) => t.slug));
    assert.equal(toolSlugs.size, 30);

    const guideSlugs = new Set(GUIDES_REGISTRY.map((g) => g.slug));
    assert.equal(guideSlugs.size, 24);

    for (const guide of GUIDES_REGISTRY) {
      assert.ok(guide.relatedToolSlug);
      assert.ok(toolSlugs.has(guide.relatedToolSlug));
    }
  });
});
