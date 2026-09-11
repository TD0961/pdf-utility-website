import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TOOLS_REGISTRY } from '../src/data/tools';
import { GUIDES_REGISTRY } from '../src/data/guides';
import { GLOBAL_FAQS } from '../src/data/faq';
import { siteConfig } from '../src/config/site';
import { isAdPlacementAllowed, isAnchorAllowed } from '../src/lib/ads/ad-strategy';
import sitemap from '../src/app/sitemap';

describe('Phase 5.3: Content Quality, Privacy Claims & AdSense Policy Audit', () => {
  describe('Privacy Claim Defensibility Audit', () => {
    const FORBIDDEN_WORDS = ['guaranteed', '100% private', 'completely secure', 'zero risk'];

    it('verifies siteConfig.description is free of exaggerated claims', () => {
      for (const word of FORBIDDEN_WORDS) {
        assert.ok(
          !siteConfig.description.toLowerCase().includes(word),
          `siteConfig.description should not contain "${word}"`
        );
      }
    });

    it('verifies all 30 tool meta descriptions are free of exaggerated claims', () => {
      for (const tool of TOOLS_REGISTRY) {
        for (const word of FORBIDDEN_WORDS) {
          assert.ok(
            !tool.metaDescription.toLowerCase().includes(word),
            `Tool ${tool.slug} metaDescription should not contain "${word}"`
          );
        }
      }
    });

    it('verifies all 24 guide meta descriptions and summaries are free of exaggerated claims', () => {
      for (const guide of GUIDES_REGISTRY) {
        for (const word of FORBIDDEN_WORDS) {
          assert.ok(
            !guide.metaDescription.toLowerCase().includes(word),
            `Guide ${guide.slug} metaDescription should not contain "${word}"`
          );
          assert.ok(
            !guide.content.summary.toLowerCase().includes(word),
            `Guide ${guide.slug} summary should not contain "${word}"`
          );
        }
      }
    });

    it('verifies global FAQs do not contain exaggerated claims', () => {
      for (const faq of GLOBAL_FAQS) {
        for (const word of FORBIDDEN_WORDS) {
          assert.ok(
            !faq.answer.toLowerCase().includes(word),
            `Global FAQ "${faq.question}" answer should not contain "${word}"`
          );
        }
      }
    });
  });

  describe('Editorial Depth & Reciprocal Linking Audit', () => {
    it('ensures every tool has complete instructional sections (steps >= 3, tips, problems, FAQs)', () => {
      for (const tool of TOOLS_REGISTRY) {
        assert.ok(tool.steps.length >= 3, `Tool ${tool.slug} should have at least 3 steps`);
        assert.ok(tool.tips.length >= 1, `Tool ${tool.slug} should have at least 1 tip`);
        assert.ok(tool.commonProblems.length >= 1, `Tool ${tool.slug} should have common problems`);
        assert.ok(tool.faqs.length >= 1, `Tool ${tool.slug} should have at least 1 FAQ`);
        assert.ok(tool.howItWorks.length > 20, `Tool ${tool.slug} should have descriptive howItWorks`);
      }
    });

    it('ensures every guide links to an existing valid tool in the registry', () => {
      const toolSlugs = new Set(TOOLS_REGISTRY.map((t) => t.slug));
      for (const guide of GUIDES_REGISTRY) {
        assert.ok(guide.relatedToolSlug, `Guide ${guide.slug} is missing relatedToolSlug`);
        assert.ok(
          toolSlugs.has(guide.relatedToolSlug),
          `Guide ${guide.slug} references non-existent tool ${guide.relatedToolSlug}`
        );
      }
    });

    it('ensures all 24 guides have substantial editorial content with at least 2 structured sections', () => {
      for (const guide of GUIDES_REGISTRY) {
        assert.ok(guide.content.sections.length >= 2, `Guide ${guide.slug} should have at least 2 sections`);
        assert.ok(guide.content.intro.length > 50, `Guide ${guide.slug} should have substantive intro`);
        assert.ok(guide.content.summary.length > 30, `Guide ${guide.slug} should have substantive summary`);
      }
    });
  });

  describe('AdSense Policy & UX Isolation Audit', () => {
    it('strictly denies anchor ads and in-workspace ads on PDF Editor', () => {
      assert.equal(isAnchorAllowed('editor'), false);
      assert.equal(isAdPlacementAllowed('editor', 'post-tool'), false);
      assert.equal(isAdPlacementAllowed('editor', 'in-content'), false);
    });

    it('strictly denies all advertisements on legal and contact pages', () => {
      assert.equal(isAnchorAllowed('legal'), false);
      assert.equal(isAdPlacementAllowed('legal', 'in-content'), false);
      assert.equal(isAdPlacementAllowed('legal', 'end-content'), false);
      assert.equal(isAnchorAllowed('contact'), false);
      assert.equal(isAdPlacementAllowed('contact', 'in-content'), false);
    });

    it('ensures no fake placeholder ads.txt exists in public or out directories', () => {
      const publicAds = path.join(process.cwd(), 'public', 'ads.txt');
      const outAds = path.join(process.cwd(), 'out', 'ads.txt');
      if (fs.existsSync(publicAds)) {
        const text = fs.readFileSync(publicAds, 'utf8');
        assert.ok(!text.includes('pub-XXXXXXXXXXXXXXXX'));
      }
      if (fs.existsSync(outAds)) {
        const text = fs.readFileSync(outAds, 'utf8');
        assert.ok(!text.includes('pub-XXXXXXXXXXXXXXXX'));
      }
    });
  });

  describe('Sitemap & Canonical URL Uniqueness', () => {
    it('ensures exactly 63 unique canonical URLs in sitemap without duplicates', () => {
      const urls = sitemap().map((e) => e.url);
      assert.equal(urls.length, 63);
      const uniqueUrls = new Set(urls);
      assert.equal(uniqueUrls.size, 63, 'All sitemap URLs must be unique');
    });
  });
});
