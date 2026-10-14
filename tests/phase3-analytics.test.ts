import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TOOLS_REGISTRY } from '../src/data/tools';
import {
  ALLOWED_TOOL_SLUGS,
  ALLOWED_OUTPUT_FORMATS,
  ALLOWED_ERROR_CODES,
  bucketFileCount,
  bucketDuration,
  categorizeErrorCode,
  sanitizeAnalyticsPayload,
  OutputFormat,
  ToolErrorCode,
} from '../src/lib/analytics/events';

describe('PDFSimplify — Phase 3 Analytics & Instrumentation Test Suite', () => {
  describe('1. Allowlist & Registry Symmetry', () => {
    it('verifies all 30 TOOLS_REGISTRY slugs are present in ALLOWED_TOOL_SLUGS', () => {
      assert.equal(TOOLS_REGISTRY.length, 30);
      assert.equal(ALLOWED_TOOL_SLUGS.length, 30);

      const registrySlugs = TOOLS_REGISTRY.map((t) => t.slug).sort();
      const validSlugs = [...ALLOWED_TOOL_SLUGS].sort();
      assert.deepEqual(validSlugs, registrySlugs);
    });

    it('verifies output formats allowlist contains standard document and image formats', () => {
      const expectedFormats: OutputFormat[] = [
        'pdf',
        'docx',
        'pptx',
        'xlsx',
        'csv',
        'md',
        'txt',
        'zip',
        'jpg',
        'png',
      ];
      for (const fmt of expectedFormats) {
        assert.ok(
          ALLOWED_OUTPUT_FORMATS.includes(fmt),
          `Expected output format "${fmt}" in ALLOWED_OUTPUT_FORMATS`
        );
      }
    });

    it('verifies standard categorical error codes are allowlisted', () => {
      const expectedErrors: ToolErrorCode[] = [
        'invalid_input',
        'password_required',
        'unsupported_format',
        'processing_failed',
        'memory_limit',
        'cancelled',
        'unknown',
      ];
      for (const code of expectedErrors) {
        assert.ok(
          ALLOWED_ERROR_CODES.includes(code),
          `Expected error code "${code}" in ALLOWED_ERROR_CODES`
        );
      }
    });
  });

  describe('2. Coarse Bucketing Privacy Safeguards', () => {
    it('correctly maps file counts to broad buckets without revealing exact numbers', () => {
      assert.equal(bucketFileCount(0), 'single');
      assert.equal(bucketFileCount(1), 'single');
      assert.equal(bucketFileCount(2), 'few_2_5');
      assert.equal(bucketFileCount(5), 'few_2_5');
      assert.equal(bucketFileCount(6), 'batch_6_plus');
      assert.equal(bucketFileCount(10), 'batch_6_plus');
      assert.equal(bucketFileCount(50), 'batch_6_plus');
    });

    it('correctly maps duration milliseconds to discrete coarse duration buckets', () => {
      assert.equal(bucketDuration(450), 'under_1s');
      assert.equal(bucketDuration(999), 'under_1s');
      assert.equal(bucketDuration(1000), '1s_to_5s');
      assert.equal(bucketDuration(4999), '1s_to_5s');
      assert.equal(bucketDuration(5000), '1s_to_5s');
      assert.equal(bucketDuration(5001), '5s_to_15s');
      assert.equal(bucketDuration(15000), '5s_to_15s');
      assert.equal(bucketDuration(15001), 'over_15s');
      assert.equal(bucketDuration(120000), 'over_15s');
    });

    it('categorizes runtime errors into categorical codes without leaking error text', () => {
      assert.equal(categorizeErrorCode(new Error('Password is required for encrypted file')), 'password_required');
      assert.equal(categorizeErrorCode(new Error('Invalid input range or empty file')), 'invalid_input');
      assert.equal(categorizeErrorCode(new Error('Out of memory ArrayBuffer heap exhaustion')), 'memory_limit');
      assert.equal(categorizeErrorCode(new Error('User cancelled the conversion operation')), 'cancelled');
      assert.equal(categorizeErrorCode(new Error('Unsupported format extension')), 'unsupported_format');
      assert.equal(categorizeErrorCode(new Error('General render processing failed')), 'processing_failed');
      assert.equal(categorizeErrorCode(null), 'unknown');
    });

    it('strips forbidden keys, large text payloads, and binary objects in sanitizeAnalyticsPayload', () => {
      const unsafePayload = {
        tool_slug: 'merge-pdf',
        file: 'dummy_file_ref',
        filename: 'confidential_contract_2026.pdf',
        filesize: 1048576,
        size: 5000,
        bytes: 1234,
        password: 'SuperSecretPassword123!',
        extractedText: 'Confidential client legal statement details...',
        stack: 'Error at /usr/local/main.js:12:45',
        longString: 'A'.repeat(100),
        duration_bucket: 'under_1s',
      };

      const sanitized = sanitizeAnalyticsPayload(unsafePayload);

      assert.equal(sanitized.tool_slug, 'merge-pdf');
      assert.equal(sanitized.duration_bucket, 'under_1s');
      assert.equal(sanitized.file, undefined);
      assert.equal(sanitized.filename, undefined);
      assert.equal(sanitized.filesize, undefined);
      assert.equal(sanitized.size, undefined);
      assert.equal(sanitized.bytes, undefined);
      assert.equal(sanitized.password, undefined);
      assert.equal(sanitized.extractedText, undefined);
      assert.equal(sanitized.stack, undefined);
      assert.equal(sanitized.longString, undefined);
    });
  });

  describe('3. Workspace Instrumentation Coverage (All 30 Tools)', () => {
    it('verifies every tool workspace imports and initializes useToolTracking', () => {
      const toolsDir = path.resolve(process.cwd(), 'src/components/tools');
      assert.ok(fs.existsSync(toolsDir), 'src/components/tools directory must exist');

      const toolDirs = fs
        .readdirSync(toolsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      let instrumentedWorkspacesCount = 0;
      const foundSlugs: string[] = [];

      for (const dir of toolDirs) {
        const fullDirPath = path.join(toolsDir, dir);
        const files = fs.readdirSync(fullDirPath);
        for (const file of files) {
          if (file.endsWith('Workspace.tsx')) {
            const content = fs.readFileSync(path.join(fullDirPath, file), 'utf-8');
            if (content.includes('useToolTracking')) {
              instrumentedWorkspacesCount++;
              const match =
                content.match(/useToolTracking\(['"]([a-z0-9-]+)['"]\)/) ||
                content.match(/toolSlug:\s*['"]([a-z0-9-]+)['"]/);
              if (match) {
                foundSlugs.push(match[1]);
              }
            }
          }
        }
      }

      assert.equal(
        instrumentedWorkspacesCount,
        30,
        `Expected all 30 tool workspace files to use useToolTracking, found ${instrumentedWorkspacesCount}`
      );

      for (const slug of ALLOWED_TOOL_SLUGS) {
        assert.ok(
          foundSlugs.includes(slug),
          `Tool workspace for slug "${slug}" must be instrumented with useToolTracking`
        );
      }
    });

    it('verifies ToolPageTracker is mounted in the tool page route', () => {
      const pageFile = path.resolve(process.cwd(), 'src/app/pdf-tools/[slug]/page.tsx');
      assert.ok(fs.existsSync(pageFile), 'Tool page component must exist');

      const content = fs.readFileSync(pageFile, 'utf-8');
      assert.ok(
        content.includes('<ToolPageTracker toolSlug={tool.slug} />'),
        'ToolPage must render <ToolPageTracker toolSlug={tool.slug} />'
      );
    });

    it('verifies GuideToolLink is mounted in the guides page route', () => {
      const guidePageFile = path.resolve(process.cwd(), 'src/app/guides/[slug]/page.tsx');
      assert.ok(fs.existsSync(guidePageFile), 'Guide page component must exist');

      const content = fs.readFileSync(guidePageFile, 'utf-8');
      assert.ok(
        content.includes('<GuideToolLink'),
        'Guide page must render <GuideToolLink ... />'
      );
    });
  });

  describe('4. Zero Privacy Leaks Code Validation', () => {
    it('ensures no tool workspace passes file size or raw filename to analytics', () => {
      const toolsDir = path.resolve(process.cwd(), 'src/components/tools');
      const toolDirs = fs
        .readdirSync(toolsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const dir of toolDirs) {
        const fullDirPath = path.join(toolsDir, dir);
        const files = fs.readdirSync(fullDirPath);
        for (const file of files) {
          if (file.endsWith('Workspace.tsx')) {
            const content = fs.readFileSync(path.join(fullDirPath, file), 'utf-8');
            assert.ok(
              !content.includes('startProcessing(file.size') &&
              !content.includes('startProcessing(file.name') &&
              !content.includes('completeProcessing(file.size') &&
              !content.includes('completeProcessing(file.name'),
              `Workspace ${file} must not pass raw file properties to tracking`
            );
          }
        }
      }
    });

    it('verifies events.ts contains strict key filtering against forbidden keys and respects DNT', () => {
      const eventsFile = path.resolve(process.cwd(), 'src/lib/analytics/events.ts');
      const content = fs.readFileSync(eventsFile, 'utf-8');

      assert.ok(
        content.includes('FORBIDDEN_KEYS'),
        'events.ts must define FORBIDDEN_KEYS'
      );
      assert.ok(
        content.includes('doNotTrack'),
        'events.ts must check navigator.doNotTrack'
      );
      assert.ok(
        content.includes('pdfsimplify_analytics_optout'),
        'events.ts must respect opt-out flag'
      );
    });
  });

  describe('5. PPTX Presentation Partition Layout Structure', () => {
    it('verifies pptx-builder renders page partition cards and presentation template layout', () => {
      const pptxBuilderFile = path.resolve(process.cwd(), 'src/lib/pdf/conversion/pptx-builder.ts');
      const content = fs.readFileSync(pptxBuilderFile, 'utf-8');

      assert.ok(
        content.includes('renderPagePartitionTemplateShapes'),
        'pptx-builder must contain renderPagePartitionTemplateShapes'
      );
      assert.ok(
        content.includes('PAGE') && content.includes('PARTITION'),
        'pptx-builder must generate page partition eyebrow badges'
      );
      assert.ok(
        content.includes('roundRect'),
        'pptx-builder must render rounded Content Partition Card frame'
      );
    });
  });
});
