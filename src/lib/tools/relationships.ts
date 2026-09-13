/**
 * PDFSimplify — Centralized Related Tools & Content Relationships Engine
 *
 * Provides curated, logically sound bidirectional connections between PDF utilities
 * and in-depth educational guides. Prevents arbitrary tool recommendations.
 */

export interface ToolRelationship {
  slug: string;
  relatedTools: string[];
  relatedGuides: string[];
}

export const TOOL_RELATIONSHIPS: Record<string, ToolRelationship> = {
  'merge-pdf': {
    slug: 'merge-pdf',
    relatedTools: ['split-pdf', 'organize-pdf', 'compress-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-merge-pdf-files',
      'how-to-organize-and-reorder-pdf-pages',
      'how-browser-based-pdf-processing-works',
    ],
  },
  'split-pdf': {
    slug: 'split-pdf',
    relatedTools: ['merge-pdf', 'organize-pdf', 'extract-pages', 'pdf-editor'],
    relatedGuides: [
      'how-to-split-a-pdf',
      'how-to-extract-pages-from-a-pdf',
      'how-to-merge-pdf-files',
    ],
  },
  'organize-pdf': {
    slug: 'organize-pdf',
    relatedTools: ['merge-pdf', 'rotate-pdf', 'extract-pages', 'pdf-editor'],
    relatedGuides: [
      'how-to-organize-and-reorder-pdf-pages',
      'how-to-rotate-pdf-pages',
      'how-to-split-a-pdf',
    ],
  },
  'rotate-pdf': {
    slug: 'rotate-pdf',
    relatedTools: ['organize-pdf', 'merge-pdf', 'extract-pages', 'pdf-editor'],
    relatedGuides: [
      'how-to-rotate-pdf-pages',
      'how-to-organize-and-reorder-pdf-pages',
    ],
  },
  'extract-pages': {
    slug: 'extract-pages',
    relatedTools: ['split-pdf', 'organize-pdf', 'merge-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-extract-pages-from-a-pdf',
      'how-to-split-a-pdf',
    ],
  },
  'jpg-to-pdf': {
    slug: 'jpg-to-pdf',
    relatedTools: ['pdf-to-jpg', 'merge-pdf', 'compress-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-convert-jpg-to-pdf',
      'how-to-convert-pdf-to-jpg',
    ],
  },
  'pdf-to-jpg': {
    slug: 'pdf-to-jpg',
    relatedTools: ['jpg-to-pdf', 'extract-pages', 'pdf-to-text', 'pdf-editor'],
    relatedGuides: [
      'how-to-convert-pdf-to-jpg',
      'how-to-convert-jpg-to-pdf',
    ],
  },
  'pdf-to-text': {
    slug: 'pdf-to-text',
    relatedTools: ['ocr-pdf', 'pdf-to-jpg', 'extract-pages', 'pdf-editor'],
    relatedGuides: [
      'how-to-extract-text-from-a-pdf',
      'what-is-ocr',
    ],
  },
  'add-page-numbers': {
    slug: 'add-page-numbers',
    relatedTools: ['watermark-pdf', 'organize-pdf', 'merge-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-add-page-numbers-to-a-pdf',
      'how-to-add-a-watermark-to-a-pdf',
    ],
  },
  'watermark-pdf': {
    slug: 'watermark-pdf',
    relatedTools: ['add-page-numbers', 'protect-pdf', 'pdf-editor', 'organize-pdf'],
    relatedGuides: [
      'how-to-add-a-watermark-to-a-pdf',
      'how-to-protect-a-pdf',
    ],
  },
  'compress-pdf': {
    slug: 'compress-pdf',
    relatedTools: ['merge-pdf', 'organize-pdf', 'split-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-compress-a-pdf',
      'how-to-organize-and-reorder-pdf-pages',
    ],
  },
  'protect-pdf': {
    slug: 'protect-pdf',
    relatedTools: ['unlock-pdf', 'watermark-pdf', 'pdf-editor', 'add-page-numbers'],
    relatedGuides: [
      'how-to-protect-a-pdf',
      'how-to-unlock-a-pdf',
    ],
  },
  'unlock-pdf': {
    slug: 'unlock-pdf',
    relatedTools: ['protect-pdf', 'watermark-pdf', 'pdf-editor', 'organize-pdf'],
    relatedGuides: [
      'how-to-unlock-a-pdf',
      'how-to-protect-a-pdf',
    ],
  },
  'ocr-pdf': {
    slug: 'ocr-pdf',
    relatedTools: ['pdf-to-word', 'pdf-to-text', 'pdf-editor', 'pdf-to-jpg'],
    relatedGuides: [
      'what-is-ocr',
      'how-to-extract-text-from-a-pdf',
    ],
  },
  'pdf-editor': {
    slug: 'pdf-editor',
    relatedTools: ['merge-pdf', 'watermark-pdf', 'organize-pdf', 'protect-pdf'],
    relatedGuides: [
      'how-to-edit-a-pdf',
      'how-to-add-a-watermark-to-a-pdf',
      'how-browser-based-pdf-processing-works',
    ],
  },
  'pdf-to-word': {
    slug: 'pdf-to-word',
    relatedTools: ['ocr-pdf', 'pdf-to-text', 'compress-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-extract-text-from-a-pdf',
      'what-is-ocr',
    ],
  },
  'pdf-to-ppt': {
    slug: 'pdf-to-ppt',
    relatedTools: ['pdf-to-word', 'extract-pages', 'compress-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-extract-pages-from-a-pdf',
      'how-browser-based-pdf-processing-works',
    ],
  },
  'pdf-to-excel': {
    slug: 'pdf-to-excel',
    relatedTools: ['pdf-to-word', 'pdf-to-text', 'extract-pages'],
    relatedGuides: [
      'how-to-extract-text-from-a-pdf',
      'how-browser-based-pdf-processing-works',
    ],
  },
  'sign-pdf': {
    slug: 'sign-pdf',
    relatedTools: ['pdf-editor', 'fill-pdf', 'protect-pdf', 'watermark-pdf'],
    relatedGuides: [
      'how-to-protect-a-pdf',
      'how-to-edit-a-pdf',
    ],
  },
  'fill-pdf': {
    slug: 'fill-pdf',
    relatedTools: ['pdf-editor', 'sign-pdf', 'protect-pdf'],
    relatedGuides: [
      'how-to-edit-a-pdf',
      'how-to-protect-a-pdf',
    ],
  },
  'crop-pdf': {
    slug: 'crop-pdf',
    relatedTools: ['rotate-pdf', 'extract-pages', 'organize-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-rotate-pdf-pages',
      'how-to-organize-and-reorder-pdf-pages',
    ],
  },
  'compare-pdf': {
    slug: 'compare-pdf',
    relatedTools: ['merge-pdf', 'pdf-editor', 'organize-pdf'],
    relatedGuides: [
      'how-to-merge-pdf-files',
      'how-browser-based-pdf-processing-works',
    ],
  },
  'pdf-to-csv': {
    slug: 'pdf-to-csv',
    relatedTools: ['pdf-to-excel', 'ocr-pdf', 'pdf-to-text', 'pdf-editor'],
    relatedGuides: [
      'how-to-convert-pdf-to-csv',
      'how-to-extract-text-from-a-pdf',
    ],
  },
  'pdf-to-markdown': {
    slug: 'pdf-to-markdown',
    relatedTools: ['pdf-to-text', 'pdf-to-word', 'ocr-pdf', 'extract-images'],
    relatedGuides: [
      'pdf-to-markdown-guide',
      'how-to-extract-text-from-a-pdf',
    ],
  },
  'extract-images': {
    slug: 'extract-images',
    relatedTools: ['pdf-to-jpg', 'jpg-to-pdf', 'pdf-editor', 'extract-pages'],
    relatedGuides: [
      'how-to-extract-images-from-a-pdf',
      'how-to-convert-pdf-to-jpg',
    ],
  },
  'flatten-pdf': {
    slug: 'flatten-pdf',
    relatedTools: ['fill-pdf', 'sign-pdf', 'protect-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-flatten-a-fillable-pdf',
      'how-to-protect-a-pdf',
    ],
  },
  'remove-pdf-metadata': {
    slug: 'remove-pdf-metadata',
    relatedTools: ['protect-pdf', 'flatten-pdf', 'unlock-pdf', 'compress-pdf'],
    relatedGuides: [
      'how-to-remove-metadata-from-a-pdf',
      'how-to-protect-a-pdf',
    ],
  },
  'resize-pdf': {
    slug: 'resize-pdf',
    relatedTools: ['crop-pdf', 'rotate-pdf', 'compress-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-resize-pdf-pages',
      'how-to-rotate-pdf-pages',
    ],
  },
  'grayscale-pdf': {
    slug: 'grayscale-pdf',
    relatedTools: ['compress-pdf', 'pdf-to-jpg', 'ocr-pdf', 'pdf-editor'],
    relatedGuides: [
      'how-to-convert-pdf-to-grayscale',
      'how-to-compress-a-pdf',
    ],
  },
  'header-footer': {
    slug: 'header-footer',
    relatedTools: ['add-page-numbers', 'watermark-pdf', 'pdf-editor', 'crop-pdf'],
    relatedGuides: [
      'how-to-add-headers-and-footers-to-a-pdf',
      'how-to-add-page-numbers-to-a-pdf',
    ],
  },
};

export function getCuratedRelationship(slug: string): ToolRelationship {
  return (
    TOOL_RELATIONSHIPS[slug] || {
      slug,
      relatedTools: ['merge-pdf', 'split-pdf', 'organize-pdf', 'pdf-editor'].filter((s) => s !== slug),
      relatedGuides: ['how-browser-based-pdf-processing-works'],
    }
  );
}
