import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS_REGISTRY } from '../src/data/tools';
import { GUIDES_REGISTRY } from '../src/data/guides';
import { TOOL_DEEP_DIVES, ToolDeepDive } from '../src/components/tools/ToolEducationalContent';
import { TOOL_RELATIONSHIPS, getCuratedRelationship } from '../src/lib/tools/relationships';
import sitemap from '../src/app/sitemap';
import { siteConfig } from '../src/config/site';

describe('PDFSimplify — Phase 2 Content Expansion & Tool Quality Tests', () => {
  describe('1. Tool Educational Deep Dives (All 30 Tools)', () => {
    it('verifies TOOL_DEEP_DIVES contains entries for all 30 registered tools', () => {
      assert.equal(TOOLS_REGISTRY.length, 30);
      const deepDiveSlugs = Object.keys(TOOL_DEEP_DIVES);
      assert.equal(deepDiveSlugs.length, 30, `Expected 30 tool deep dives, found ${deepDiveSlugs.length}`);

      for (const tool of TOOLS_REGISTRY) {
        const deepDive: ToolDeepDive | undefined = TOOL_DEEP_DIVES[tool.slug];
        assert.ok(deepDive, `Tool "${tool.slug}" must have an entry in TOOL_DEEP_DIVES`);
        assert.ok(deepDive.engine && deepDive.engine.length > 10, `Tool "${tool.slug}" must specify browser engine details`);
        assert.ok(Array.isArray(deepDive.aspects) && deepDive.aspects.length >= 3, `Tool "${tool.slug}" must have at least 3 technical aspects`);
        assert.ok(Array.isArray(deepDive.considerations) && deepDive.considerations.length >= 3, `Tool "${tool.slug}" must have at least 3 considerations/limitations`);

        // Check that aspects have headings and descriptions
        for (const aspect of deepDive.aspects) {
          assert.ok(aspect.heading && aspect.heading.length > 3, `Aspect in "${tool.slug}" must have a heading`);
          assert.ok(aspect.description && aspect.description.length > 15, `Aspect in "${tool.slug}" must have a description`);
        }
        for (const consideration of deepDive.considerations) {
          assert.ok(consideration && consideration.length > 15, `Consideration in "${tool.slug}" must be descriptive`);
        }
      }
    });

    it('ensures educational content does not contain false or hyperbolic claims', () => {
      const prohibitedPhrases = [
        'military-grade',
        '100% perfect',
        'works with every pdf',
        'best pdf tool',
        'guaranteed ranking',
      ];

      for (const [slug, deepDive] of Object.entries(TOOL_DEEP_DIVES)) {
        const textBlob = `${deepDive.engine} ${deepDive.aspects.map(a => `${a.heading} ${a.description}`).join(' ')} ${deepDive.considerations.join(' ')}`.toLowerCase();
        for (const phrase of prohibitedPhrases) {
          assert.ok(
            !textBlob.includes(phrase),
            `Tool deep dive "${slug}" contains prohibited hyperbolic phrase: "${phrase}"`
          );
        }
      }
    });
  });

  describe('2. JPG-to-PDF Format Accuracy & Multi-Image Support', () => {
    it('verifies jpg-to-pdf metadata, features, tips, and FAQs accurately cover JPG, PNG, and WebP', () => {
      const jpgTool = TOOLS_REGISTRY.find((t) => t.slug === 'jpg-to-pdf');
      assert.ok(jpgTool, 'jpg-to-pdf tool must exist');

      // Check shortDescription and metaDescription
      assert.ok(jpgTool.shortDescription.includes('PNG') || jpgTool.shortDescription.includes('image'), 'shortDescription mentions image formats');
      assert.ok(jpgTool.metaDescription.includes('PNG') && jpgTool.metaDescription.includes('WebP'), 'metaDescription mentions PNG and WebP');

      // Check features
      const featuresText = jpgTool.features.join(' ');
      assert.ok(featuresText.includes('PNG') && featuresText.includes('WebP'), 'Features must describe PNG and WebP support');
      assert.ok(featuresText.toLowerCase().includes('alpha') || featuresText.toLowerCase().includes('transparen'), 'Features must mention transparent canvas handling');

      // Check FAQs
      const faqsText = jpgTool.faqs.map((f) => `${f.question} ${f.answer}`).join(' ');
      assert.ok(faqsText.includes('PNG'), 'FAQs must answer questions about PNG support');
      assert.ok(faqsText.includes('WebP'), 'FAQs must answer questions about WebP support');
      assert.ok(faqsText.toLowerCase().includes('transpar'), 'FAQs must discuss background/transparency handling');
    });
  });

  describe('3. Comprehensive Companion Guides Expansion', () => {
    it('verifies GUIDES_REGISTRY contains exactly 30 high-value guides', () => {
      assert.equal(GUIDES_REGISTRY.length, 30, `Expected 30 guides, got ${GUIDES_REGISTRY.length}`);
    });

    it('verifies all 6 new priority companion guides exist with valid structure and reciprocal tool links', () => {
      const newGuideSlugs = [
        'how-to-convert-pdf-to-word',
        'how-to-convert-pdf-to-excel',
        'how-to-convert-pdf-to-powerpoint',
        'how-to-sign-a-pdf',
        'how-to-fill-a-pdf-form',
        'how-to-compare-two-pdf-files',
      ];

      for (const slug of newGuideSlugs) {
        const guide = GUIDES_REGISTRY.find((g) => g.slug === slug);
        assert.ok(guide, `Guide "${slug}" must exist in GUIDES_REGISTRY`);
        assert.ok(guide.title.length > 10, `Guide "${slug}" title must be descriptive`);
        assert.ok(guide.metaDescription.length > 50, `Guide "${slug}" metaDescription must be informative`);
        assert.ok(guide.content.sections.length >= 3, `Guide "${slug}" must have at least 3 content sections`);

        // Check reciprocal tool link
        assert.ok(guide.relatedToolSlug, `Guide "${slug}" must have relatedToolSlug`);
        const tool = TOOLS_REGISTRY.find((t) => t.slug === guide.relatedToolSlug);
        assert.ok(tool, `Guide "${slug}" relatedToolSlug "${guide.relatedToolSlug}" must exist in TOOLS_REGISTRY`);

        // Check that guide includes FAQ section
        const hasFaqSection = guide.content.sections.some((s) =>
          s.heading.toLowerCase().includes('faq') || s.heading.toLowerCase().includes('questions')
        );
        assert.ok(hasFaqSection, `Guide "${slug}" must contain a FAQ section`);
      }
    });

    it('verifies accurate technical boundaries in priority companion guides', () => {
      // 1. Sign PDF: must distinguish electronic visual signature (SES) from cryptographic PKI digital signatures
      const signGuide = GUIDES_REGISTRY.find((g) => g.slug === 'how-to-sign-a-pdf');
      assert.ok(signGuide);
      const signText = JSON.stringify(signGuide).toLowerCase();
      assert.ok(signText.includes('cryptographic') || signText.includes('certificate') || signText.includes('pki'), 'Sign guide must discuss cryptographic/certificate distinction');

      // 2. Word/Excel/PPT: must explain OpenXML generation and layout reflow vs scanned raster images
      const wordGuide = GUIDES_REGISTRY.find((g) => g.slug === 'how-to-convert-pdf-to-word');
      assert.ok(wordGuide);
      const wordText = JSON.stringify(wordGuide).toLowerCase();
      assert.ok(wordText.includes('docx') || wordText.includes('openxml'), 'Word guide must discuss .docx/OpenXML structure');

      // 3. Compare PDF: must explain visual overlay / dual-canvas diffing
      const compareGuide = GUIDES_REGISTRY.find((g) => g.slug === 'how-to-compare-two-pdf-files');
      assert.ok(compareGuide);
      const compareText = JSON.stringify(compareGuide).toLowerCase();
      assert.ok(compareText.includes('visual') || compareText.includes('canvas'), 'Compare guide must discuss visual canvas comparison');

      // 4. Fill PDF: must explain AcroForm dictionaries and flattened forms
      const fillGuide = GUIDES_REGISTRY.find((g) => g.slug === 'how-to-fill-a-pdf-form');
      assert.ok(fillGuide);
      const fillText = JSON.stringify(fillGuide).toLowerCase();
      assert.ok(fillText.includes('acroform') || fillText.includes('flatten'), 'Fill guide must discuss AcroForm/flattening');
    });
  });

  describe('4. Bidirectional Internal Linking Engine', () => {
    it('verifies priority tools map to their companion guides in TOOL_RELATIONSHIPS', () => {
      const priorityMap: Record<string, string> = {
        'pdf-to-word': 'how-to-convert-pdf-to-word',
        'pdf-to-excel': 'how-to-convert-pdf-to-excel',
        'pdf-to-ppt': 'how-to-convert-pdf-to-powerpoint',
        'sign-pdf': 'how-to-sign-a-pdf',
        'fill-pdf': 'how-to-fill-a-pdf-form',
        'compare-pdf': 'how-to-compare-two-pdf-files',
      };

      for (const [toolSlug, guideSlug] of Object.entries(priorityMap)) {
        const rel = getCuratedRelationship(toolSlug);
        assert.ok(
          rel.relatedGuides.includes(guideSlug),
          `Tool "${toolSlug}" relationships must include guide "${guideSlug}"`
        );
      }
    });

    it('verifies all guide slugs referenced across TOOL_RELATIONSHIPS exist in GUIDES_REGISTRY', () => {
      const allGuideSlugs = new Set(GUIDES_REGISTRY.map((g) => g.slug));
      for (const [toolSlug, rel] of Object.entries(TOOL_RELATIONSHIPS)) {
        for (const gSlug of rel.relatedGuides) {
          assert.ok(
            allGuideSlugs.has(gSlug),
            `Relationship for "${toolSlug}" references non-existent guide: "${gSlug}"`
          );
        }
      }
    });

    it('verifies all tool slugs referenced across TOOL_RELATIONSHIPS exist in TOOLS_REGISTRY', () => {
      const allToolSlugs = new Set(TOOLS_REGISTRY.map((t) => t.slug));
      for (const [toolSlug, rel] of Object.entries(TOOL_RELATIONSHIPS)) {
        assert.ok(allToolSlugs.has(toolSlug), `TOOL_RELATIONSHIPS key "${toolSlug}" must exist in TOOLS_REGISTRY`);
        for (const relatedTool of rel.relatedTools) {
          assert.ok(
            allToolSlugs.has(relatedTool),
            `Tool "${toolSlug}" references non-existent related tool: "${relatedTool}"`
          );
        }
      }
    });
  });

  describe('5. Complete Sitemap & Route Inventory', () => {
    it('verifies sitemap output contains exactly 70 URLs (10 static + 30 tools + 30 guides)', () => {
      const entries = sitemap();
      assert.equal(entries.length, 70, `Expected 70 sitemap entries, got ${entries.length}`);

      const urls = new Set(entries.map((e) => e.url));

      // Check all 30 tools
      for (const tool of TOOLS_REGISTRY) {
        assert.ok(urls.has(`${siteConfig.url}/pdf-tools/${tool.slug}`), `Sitemap missing tool: ${tool.slug}`);
      }

      // Check all 30 guides
      for (const guide of GUIDES_REGISTRY) {
        assert.ok(urls.has(`${siteConfig.url}/guides/${guide.slug}`), `Sitemap missing guide: ${guide.slug}`);
      }
    });
  });
});
