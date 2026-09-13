import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS_REGISTRY, getToolBySlug, getRelatedTools, getRelatedGuidesForTool } from '../src/data/tools';
import { GUIDES_REGISTRY, getGuideBySlug, getRelatedGuides } from '../src/data/guides';
import { getFaqSchema, getToolSoftwareSchema, getArticleSchema } from '../src/lib/seo/jsonld';
import { constructMetadata, SITE_URL } from '../src/lib/seo/metadata';

describe('Phase 5: SEO Architecture & Content Footprint', () => {
  it('contains exactly 30 tools in the tools registry with valid metadata', () => {
    assert.equal(TOOLS_REGISTRY.length, 30);

    for (const tool of TOOLS_REGISTRY) {
      assert.ok(tool.slug);
      assert.ok(tool.name);
      assert.ok(tool.shortDescription);
      assert.ok(tool.metaDescription);
      assert.ok(tool.category);
      assert.ok(tool.features.length >= 3);
      assert.ok(tool.faqs.length >= 1);
    }
  });

  it('contains exactly 24 comprehensive guides in the guides registry with reciprocal tool links', () => {
    assert.equal(GUIDES_REGISTRY.length, 24);

    for (const guide of GUIDES_REGISTRY) {
      assert.ok(guide.slug);
      assert.ok(guide.title);
      assert.ok(guide.shortDescription);
      assert.ok(guide.readTime);
      assert.ok(guide.content.sections.length >= 2);
      assert.ok(guide.content.summary);

      // Verify reciprocal tool exists in TOOLS_REGISTRY
      assert.ok(guide.relatedToolSlug);
      const reciprocalTool = getToolBySlug(guide.relatedToolSlug);
      assert.ok(reciprocalTool);
      assert.equal(reciprocalTool?.slug, guide.relatedToolSlug);
    }
  });

  it('resolves at least 3 related tools for every tool without self-references', () => {
    for (const tool of TOOLS_REGISTRY) {
      const related = getRelatedTools(tool);
      assert.ok(related.length >= 3);
      assert.ok(!related.map((r) => r.slug).includes(tool.slug));
    }
  });

  it('resolves at least 2 related guides for every tool with valid registry items', () => {
    for (const tool of TOOLS_REGISTRY) {
      const guideSlugs = getRelatedGuidesForTool(tool);
      assert.ok(guideSlugs.length >= 2);
      for (const slug of guideSlugs) {
        assert.ok(getGuideBySlug(slug));
      }
    }
  });

  it('resolves related guides without self-references', () => {
    for (const guide of GUIDES_REGISTRY) {
      const related = getRelatedGuides(guide.slug, 2);
      assert.equal(related.length, 2);
      assert.ok(!related.map((r) => r.slug).includes(guide.slug));
    }
  });

  it('generates valid Schema.org SoftwareApplication / WebApplication JSON-LD', () => {
    const schema = getToolSoftwareSchema({
      name: 'Merge PDF',
      description: 'Merge multiple PDF files into one.',
      url: 'https://pdfsimplify.com/pdf-tools/merge-pdf',
    });

    assert.equal(schema['@context'], 'https://schema.org');
    assert.equal(schema['@type'], 'WebApplication');
    assert.equal(schema.name, 'Merge PDF — PDFSimplify');
    assert.equal(schema.applicationCategory, 'BusinessApplication');
  });

  it('generates valid Schema.org FAQPage JSON-LD', () => {
    const faqs = [
      { question: 'Is it free?', answer: 'Yes, 100% free.' },
      { question: 'Where are files processed?', answer: 'Locally in your browser.' },
    ];
    const schema = getFaqSchema(faqs);

    assert.equal(schema['@context'], 'https://schema.org');
    assert.equal(schema['@type'], 'FAQPage');
    assert.equal(schema.mainEntity.length, 2);
    assert.equal(schema.mainEntity[0]['@type'], 'Question');
    assert.equal(schema.mainEntity[0].name, 'Is it free?');
    assert.equal(schema.mainEntity[0].acceptedAnswer['@type'], 'Answer');
    assert.equal(schema.mainEntity[0].acceptedAnswer.text, 'Yes, 100% free.');
  });

  it('generates valid Schema.org Article JSON-LD for guides', () => {
    const guide = GUIDES_REGISTRY[0];
    const schema = getArticleSchema({
      title: guide.title,
      description: guide.shortDescription,
      url: `${SITE_URL}/guides/${guide.slug}`,
      publishedDate: guide.publishedDate,
      updatedDate: guide.updatedDate,
    });

    assert.equal(schema['@context'], 'https://schema.org');
    assert.equal(schema['@type'], 'Article');
    assert.equal(schema.headline, guide.title);
    assert.equal(
      (schema.mainEntityOfPage as { '@id'?: string })?.['@id'],
      `${SITE_URL}/guides/${guide.slug}`
    );
    assert.equal((schema.author as { name?: string })?.name, 'PDFSimplify');
  });

  it('constructs metadata with canonical URL and openGraph', () => {
    const meta = constructMetadata({
      title: 'Protect PDF Online',
      description: 'Encrypt and password-protect your PDF files.',
      path: '/pdf-tools/protect-pdf',
    });

    assert.equal(meta.title, 'Protect PDF Online | PDFSimplify');
    assert.equal(meta.description, 'Encrypt and password-protect your PDF files.');
    assert.equal(meta.alternates?.canonical, `${SITE_URL}/pdf-tools/protect-pdf`);
    assert.equal(meta.openGraph?.url, `${SITE_URL}/pdf-tools/protect-pdf`);
  });
});
