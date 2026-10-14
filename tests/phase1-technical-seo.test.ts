import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { TOOLS_REGISTRY } from '../src/data/tools';
import { GUIDES_REGISTRY } from '../src/data/guides';
import { constructMetadata, formatTitle, SITE_NAME, SITE_URL, SITE_TAGLINE } from '../src/lib/seo/metadata';
import { getBreadcrumbSchema } from '../src/lib/seo/jsonld';
import sitemap from '../src/app/sitemap';

describe('Phase 1: Comprehensive Technical SEO and Metadata Validation', () => {
  describe('1. Title Composition & Metadata Consistency', () => {
    it('generates the default brand tagline for empty or undefined title', () => {
      assert.equal(formatTitle(), `${SITE_NAME} — ${SITE_TAGLINE}`);
      assert.equal(formatTitle(''), `${SITE_NAME} — ${SITE_TAGLINE}`);
      assert.equal(formatTitle('   '), `${SITE_NAME} — ${SITE_TAGLINE}`);
    });

    it('appends the brand suffix exactly once for a standard page title', () => {
      assert.equal(formatTitle('Merge PDF'), `Merge PDF | ${SITE_NAME}`);
      assert.equal(formatTitle('Privacy Policy'), `Privacy Policy | ${SITE_NAME}`);
    });

    it('does not duplicate brand when title already ends with | PDFSimplify, — PDFSimplify, or - PDFSimplify', () => {
      assert.equal(formatTitle(`Contact Us | ${SITE_NAME}`), `Contact Us | ${SITE_NAME}`);
      assert.equal(formatTitle(`About Us — ${SITE_NAME}`), `About Us — ${SITE_NAME}`);
      assert.equal(formatTitle(`Security - ${SITE_NAME}`), `Security - ${SITE_NAME}`);
      assert.equal(formatTitle(SITE_NAME), SITE_NAME);
    });

    it('formats metadata for all guides with singular brand and no redundant guide suffix', () => {
      assert.equal(GUIDES_REGISTRY.length, 30);

      for (const guide of GUIDES_REGISTRY) {
        const meta = constructMetadata({
          title: guide.title,
          description: guide.metaDescription,
          path: `/guides/${guide.slug}`,
        });

        // Ensure title contains brand exactly once
        const occurrences = (String(meta.title).match(new RegExp(SITE_NAME, 'g')) || []).length;
        assert.equal(occurrences, 1, `Guide ${guide.slug} contains duplicated brand: ${meta.title}`);

        // Ensure no legacy redundant "— PDFSimplify Guides" string
        assert.ok(
          !String(meta.title).includes('— PDFSimplify Guides'),
          `Guide ${guide.slug} contains redundant "— PDFSimplify Guides"`
        );

        // Ensure canonical URL is well-formed
        assert.equal(meta.alternates?.canonical, `${SITE_URL}/guides/${guide.slug}`);
      }
    });

    it('formats metadata for all 30 tools with singular brand suffix and valid canonical', () => {
      assert.equal(TOOLS_REGISTRY.length, 30);

      for (const tool of TOOLS_REGISTRY) {
        const meta = constructMetadata({
          title: `${tool.name} — Free & Private In-Browser PDF Tool`,
          description: tool.metaDescription,
          path: `/pdf-tools/${tool.slug}`,
        });

        const occurrences = (String(meta.title).match(new RegExp(SITE_NAME, 'g')) || []).length;
        assert.equal(occurrences, 1, `Tool ${tool.slug} contains duplicated brand: ${meta.title}`);
        assert.equal(meta.alternates?.canonical, `${SITE_URL}/pdf-tools/${tool.slug}`);
      }
    });
  });

  describe('2. Breadcrumb Structured Data (JSON-LD)', () => {
    it('generates a valid tool page breadcrumb with canonical leaf URL', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'PDF Tools', url: '/pdf-tools' },
        { name: 'Merge PDF', url: '/pdf-tools/merge-pdf' },
      ];

      const schema = getBreadcrumbSchema(items);
      assert.equal(schema['@context'], 'https://schema.org');
      assert.equal(schema['@type'], 'BreadcrumbList');
      assert.equal(schema.itemListElement.length, 3);

      assert.equal(schema.itemListElement[0].name, 'Home');
      assert.equal(schema.itemListElement[0].item, `${SITE_URL}/`);
      assert.equal(schema.itemListElement[0].position, 1);

      assert.equal(schema.itemListElement[1].name, 'PDF Tools');
      assert.equal(schema.itemListElement[1].item, `${SITE_URL}/pdf-tools`);
      assert.equal(schema.itemListElement[1].position, 2);

      assert.equal(schema.itemListElement[2].name, 'Merge PDF');
      assert.equal(schema.itemListElement[2].item, `${SITE_URL}/pdf-tools/merge-pdf`);
      assert.equal(schema.itemListElement[2].position, 3);
    });

    it('generates a valid guide page breadcrumb with canonical leaf URL', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/guides' },
        { name: 'How to Merge PDF Files', url: '/guides/how-to-merge-pdf-files' },
      ];

      const schema = getBreadcrumbSchema(items);
      assert.equal(schema.itemListElement.length, 3);
      assert.equal(schema.itemListElement[2].item, `${SITE_URL}/guides/how-to-merge-pdf-files`);
    });

    it('supports arbitrary nested breadcrumb hierarchies', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Resources', url: '/resources' },
        { name: 'Architecture', url: '/resources/architecture' },
        { name: 'WebAssembly', url: '/resources/architecture/wasm' },
      ];

      const schema = getBreadcrumbSchema(items);
      assert.equal(schema.itemListElement.length, 4);
      assert.equal(schema.itemListElement[3].position, 4);
      assert.equal(schema.itemListElement[3].item, `${SITE_URL}/resources/architecture/wasm`);
    });

    it('omits the item property for a leaf without an href, and NEVER falls back to homepage', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/guides' },
        { name: 'Unlinked Leaf Guide' }, // no url provided
      ];

      const schema = getBreadcrumbSchema(items);
      assert.equal(schema.itemListElement.length, 3);
      const leaf = schema.itemListElement[2];

      assert.equal(leaf.name, 'Unlinked Leaf Guide');
      assert.equal(leaf.position, 3);
      assert.equal(leaf.item, undefined, 'Leaf item URL must be omitted when href is undefined');
      assert.notEqual(leaf.item, `${SITE_URL}/`, 'Leaf item must NEVER fallback to the homepage URL');
      assert.notEqual(leaf.item, '/', 'Leaf item must NEVER fallback to relative slash');
    });

    it('generates a valid homepage breadcrumb', () => {
      const items = [{ name: 'Home', url: '/' }];
      const schema = getBreadcrumbSchema(items);

      assert.equal(schema.itemListElement.length, 1);
      assert.equal(schema.itemListElement[0].name, 'Home');
      assert.equal(schema.itemListElement[0].item, `${SITE_URL}/`);
    });

    it('produces strictly valid JSON without serialization errors', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'PDF Tools', url: '/pdf-tools' },
        { name: 'Compress PDF', url: '/pdf-tools/compress-pdf' },
      ];

      const schema = getBreadcrumbSchema(items);
      const json = JSON.stringify(schema);
      assert.ok(json.length > 50);
      const parsed = JSON.parse(json);
      assert.equal(parsed['@type'], 'BreadcrumbList');
    });
  });

  describe('3. Social Sharing Image & Metadata (OpenGraph & Twitter)', () => {
    it('verifies that public/og-image.png exists physically and is non-empty', () => {
      const ogPath = resolve('public/og-image.png');
      assert.ok(existsSync(ogPath), 'public/og-image.png must exist');
      const bytes = readFileSync(ogPath);
      assert.ok(bytes.length > 50000, 'public/og-image.png must be a substantial image asset');

      // Verify PNG magic header: \x89PNG\r\n\x1a\n
      assert.equal(bytes[0], 0x89);
      assert.equal(bytes[1], 0x50);
      assert.equal(bytes[2], 0x4e);
      assert.equal(bytes[3], 0x47);
    });

    it('injects absolute canonical og:image metadata in constructMetadata by default', () => {
      const meta = constructMetadata({
        title: 'Merge PDF',
        path: '/pdf-tools/merge-pdf',
      });

      const ogImages = meta.openGraph?.images as Array<{ url: string; width: number; height: number; type: string; alt: string }>;
      assert.ok(Array.isArray(ogImages));
      assert.equal(ogImages.length, 1);
      assert.equal(ogImages[0].url, `${SITE_URL}/og-image.png`);
      assert.equal(ogImages[0].width, 1200);
      assert.equal(ogImages[0].height, 630);
      assert.equal(ogImages[0].type, 'image/png');
      assert.ok(ogImages[0].alt.includes(SITE_NAME));

      const twitterMeta = meta.twitter as { card?: string; images?: string[] };
      assert.ok(Array.isArray(twitterMeta.images));
      assert.equal(twitterMeta.images[0], `${SITE_URL}/og-image.png`);
      assert.equal(twitterMeta.card, 'summary_large_image');
    });

    it('allows overriding og:image with custom page-specific image', () => {
      const meta = constructMetadata({
        title: 'Special Tool',
        path: '/special',
        image: '/custom-cover.png',
        imageAlt: 'Custom Cover',
      });

      const ogImages = meta.openGraph?.images as Array<{ url: string; alt: string }>;
      assert.equal(ogImages[0].url, `${SITE_URL}/custom-cover.png`);
      assert.equal(ogImages[0].alt, 'Custom Cover');
    });
  });

  describe('4. Navigation & URL Consistency (Header & Footer)', () => {
    it('verifies Navbar navigation links use canonical privacy route', () => {
      const navbarSrc = readFileSync(resolve('src/components/navigation/Navbar.tsx'), 'utf-8');
      assert.ok(navbarSrc.includes("href: '/privacy-policy'"), 'Navbar must link to /privacy-policy');
      assert.ok(!navbarSrc.includes("href: '/privacy'"), 'Navbar must not link to legacy /privacy');
    });

    it('verifies Footer contains links to Resources, Security, Cookies, and canonical legal pages', () => {
      const footerSrc = readFileSync(resolve('src/components/layout/Footer.tsx'), 'utf-8');
      assert.ok(footerSrc.includes('href="/resources"'), 'Footer must expose /resources');
      assert.ok(footerSrc.includes('href="/security"'), 'Footer must expose /security');
      assert.ok(footerSrc.includes('href="/cookie-policy"'), 'Footer must expose /cookie-policy');
      assert.ok(footerSrc.includes('href="/privacy-policy"'), 'Footer must expose /privacy-policy');
      assert.ok(footerSrc.includes('href="/terms"'), 'Footer must expose /terms');
      assert.ok(footerSrc.includes('href="/pdf-tools"'), 'Footer must expose /pdf-tools');
      assert.ok(footerSrc.includes('href="/guides"'), 'Footer must expose /guides');
      assert.ok(footerSrc.includes('href="/about"'), 'Footer must expose /about');
      assert.ok(footerSrc.includes('href="/contact"'), 'Footer must expose /contact');

      // Ensure no links to legacy non-canonical paths
      assert.ok(!footerSrc.includes('href="/privacy"'), 'Footer must not link to legacy /privacy');
      assert.ok(!footerSrc.includes('href="/terms-of-service"'), 'Footer must not link to legacy /terms-of-service');
    });

    it('verifies that no source files contain internal links to /privacy or /terms-of-service', () => {
      const filesToCheck = [
        'src/components/navigation/Navbar.tsx',
        'src/components/layout/Footer.tsx',
        'src/app/page.tsx',
        'src/app/about/page.tsx',
        'src/app/contact/page.tsx',
        'src/app/resources/page.tsx',
        'src/app/security/page.tsx',
      ];

      for (const relPath of filesToCheck) {
        const fullPath = resolve(relPath);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          assert.ok(!content.includes('href="/privacy"'), `${relPath} links to /privacy`);
          assert.ok(!content.includes('href="/terms-of-service"'), `${relPath} links to /terms-of-service`);
        }
      }
    });
  });

  describe('5. Redirect Rules & Edge Hosting Configuration', () => {
    it('verifies public/_redirects contains Cloudflare Pages 301 rules for legacy aliases', () => {
      const redirectsPath = resolve('public/_redirects');
      assert.ok(existsSync(redirectsPath), 'public/_redirects must exist');
      const content = readFileSync(redirectsPath, 'utf-8');

      assert.ok(content.includes('/privacy /privacy-policy 301'), 'Must redirect /privacy to /privacy-policy 301');
      assert.ok(content.includes('/terms-of-service /terms 301'), 'Must redirect /terms-of-service to /terms 301');
    });

    it('verifies vercel.json contains permanent redirects matching edge rules', () => {
      const vercelPath = resolve('vercel.json');
      const content = JSON.parse(readFileSync(vercelPath, 'utf-8'));
      assert.ok(Array.isArray(content.redirects));

      const privRedirect = content.redirects.find((r: { source: string }) => r.source === '/privacy');
      assert.ok(privRedirect);
      assert.equal(privRedirect.destination, '/privacy-policy');
      assert.equal(privRedirect.permanent, true);

      const termsRedirect = content.redirects.find((r: { source: string }) => r.source === '/terms-of-service');
      assert.ok(termsRedirect);
      assert.equal(termsRedirect.destination, '/terms');
      assert.equal(termsRedirect.permanent, true);
    });

    it('verifies legacy alias page shims have noIndex: true to protect against duplicate indexing', () => {
      const privShim = readFileSync(resolve('src/app/privacy/page.tsx'), 'utf-8');
      assert.ok(privShim.includes('noIndex: true'), 'src/app/privacy/page.tsx must have noIndex: true');

      const termsShim = readFileSync(resolve('src/app/terms-of-service/page.tsx'), 'utf-8');
      assert.ok(termsShim.includes('noIndex: true'), 'src/app/terms-of-service/page.tsx must have noIndex: true');
    });
  });

  describe('6. Sitemap Route Inventory & Canonical Consistency', () => {
    it('verifies sitemap generates exactly 70 URLs with 10 static, 30 tools, and 30 guides', () => {
      const entries = sitemap();
      assert.equal(entries.length, 70, `Sitemap must contain exactly 70 URLs, got ${entries.length}`);

      // Verify canonical legal pages are present
      const urls = entries.map((e) => e.url);
      assert.ok(urls.includes(`${SITE_URL}/privacy-policy`), 'Sitemap must contain /privacy-policy');
      assert.ok(urls.includes(`${SITE_URL}/terms`), 'Sitemap must contain /terms');
      assert.ok(urls.includes(`${SITE_URL}/cookie-policy`), 'Sitemap must contain /cookie-policy');
      assert.ok(urls.includes(`${SITE_URL}/resources`), 'Sitemap must contain /resources');
      assert.ok(urls.includes(`${SITE_URL}/security`), 'Sitemap must contain /security');

      // Verify legacy aliases are NOT in sitemap
      assert.ok(!urls.includes(`${SITE_URL}/privacy`), 'Sitemap must NOT contain legacy /privacy');
      assert.ok(!urls.includes(`${SITE_URL}/terms-of-service`), 'Sitemap must NOT contain legacy /terms-of-service');

      // Verify all tools and guides are present
      for (const tool of TOOLS_REGISTRY) {
        assert.ok(urls.includes(`${SITE_URL}/pdf-tools/${tool.slug}`), `Sitemap missing tool: ${tool.slug}`);
      }
      for (const guide of GUIDES_REGISTRY) {
        assert.ok(urls.includes(`${SITE_URL}/guides/${guide.slug}`), `Sitemap missing guide: ${guide.slug}`);
      }
    });
  });
});
