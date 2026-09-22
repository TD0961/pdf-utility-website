import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { siteConfig, SITE_NAME, SITE_URL, SITE_DOMAIN } from '../src/config/site';
import { constructMetadata } from '../src/lib/seo/metadata';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
import { TOOLS_REGISTRY } from '../src/data/tools';
import { GUIDES_REGISTRY } from '../src/data/guides';

describe('Phase 5.2: Pre-Launch Domain, Search & Monetization Readiness', () => {
  describe('Centralized Site Configuration', () => {
    it('defines canonical site configuration with expected values', () => {
      assert.equal(siteConfig.name, 'PDFSimplify');
      assert.equal(siteConfig.domain, 'pdfsimplify.com');
      assert.equal(siteConfig.tagline, 'Simple PDF tools. Private by design.');
      assert.ok(siteConfig.url.startsWith('https://'));
      assert.equal(siteConfig.supportEmail, 'support@pdfsimplify.com');
      assert.equal(siteConfig.privacyEmail, 'privacy@pdfsimplify.com');
    });

    it('exports backwards-compatible constants matching siteConfig', () => {
      assert.equal(SITE_NAME, siteConfig.name);
      assert.equal(SITE_URL, siteConfig.url);
      assert.equal(SITE_DOMAIN, siteConfig.domain);
    });

    it('generates canonical URLs rooted at siteConfig.url', () => {
      const meta = constructMetadata({ path: '/pdf-tools/merge-pdf' });
      assert.equal(meta.alternates?.canonical, `${siteConfig.url}/pdf-tools/merge-pdf`);
    });
  });

  describe('Search Engine Readiness & Sitemap Integrity', () => {
    it('produces exactly 64 indexable canonical URLs (10 core + 30 tools + 24 guides)', () => {
      const generatedSitemap = sitemap();
      assert.equal(generatedSitemap.length, 64);

      // Verify breakdown
      assert.equal(TOOLS_REGISTRY.length, 30);
      assert.equal(GUIDES_REGISTRY.length, 24);
      const coreCount = generatedSitemap.length - TOOLS_REGISTRY.length - GUIDES_REGISTRY.length;
      assert.equal(coreCount, 10);
    });

    it('ensures all sitemap URLs start with siteConfig.url', () => {
      const generatedSitemap = sitemap();
      for (const entry of generatedSitemap) {
        assert.ok(
          entry.url.startsWith(siteConfig.url),
          `Sitemap entry ${entry.url} does not start with ${siteConfig.url}`
        );
      }
    });

    it('ensures robots.txt references the canonical sitemap.xml', () => {
      const robotsConfig = robots();
      assert.equal(robotsConfig.sitemap, `${siteConfig.url}/sitemap.xml`);
      const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
      assert.equal(rules?.allow, '/');
    });
  });

  describe('AdSense Safety & Policy Guards', () => {
    it('does NOT activate fake or placeholder ads.txt in public/ or out/', () => {
      const publicAdsPath = path.join(process.cwd(), 'public', 'ads.txt');
      const outAdsPath = path.join(process.cwd(), 'out', 'ads.txt');

      if (fs.existsSync(publicAdsPath)) {
        const content = fs.readFileSync(publicAdsPath, 'utf8');
        assert.ok(!content.includes('pub-XXXXXXXXXXXXXXXX'), 'public/ads.txt must not contain placeholder ID');
      }

      if (fs.existsSync(outAdsPath)) {
        const content = fs.readFileSync(outAdsPath, 'utf8');
        assert.ok(!content.includes('pub-XXXXXXXXXXXXXXXX'), 'out/ads.txt must not contain placeholder ID');
      }
    });

    it('provides .env.example with documented optional environment variables', () => {
      const envExamplePath = path.join(process.cwd(), '.env.example');
      assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');

      const content = fs.readFileSync(envExamplePath, 'utf8');
      assert.ok(content.includes('NEXT_PUBLIC_SITE_URL'));
      assert.ok(content.includes('NEXT_PUBLIC_ADSENSE_CLIENT_ID'));
      assert.ok(content.includes('NEXT_PUBLIC_ADSENSE_ENABLED'));
      assert.ok(content.includes('NEXT_PUBLIC_ADSENSE_TEST_MODE'));
    });
  });

  describe('Repository Preflight & Zero Secrets Leakage', () => {
    it('ensures no live secret files (.env, .env.local, .env.production) are committed', () => {
      const forbiddenFiles = ['.env', '.env.local', '.env.production', '.env.development.local'];
      for (const file of forbiddenFiles) {
        const filePath = path.join(process.cwd(), file);
        assert.ok(!fs.existsSync(filePath), `${file} should not exist in working directory`);
      }
    });

    it('ensures production launch checklist exists with required classification sections', () => {
      const checklistPath = path.join(process.cwd(), 'docs', 'production_launch_checklist.md');
      assert.ok(fs.existsSync(checklistPath), 'production_launch_checklist.md must exist');

      const content = fs.readFileSync(checklistPath, 'utf8');
      assert.ok(content.includes('VERIFIED NOW'));
      assert.ok(content.includes('PREPARED'));
      assert.ok(content.includes('NOT YET VERIFIED'));
    });
  });
});
