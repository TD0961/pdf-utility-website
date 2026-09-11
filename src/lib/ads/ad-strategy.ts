/**
 * iLikePDF — Centralized Ad Strategy & Policy Configuration
 *
 * Governs where and how advertisements can be placed across the platform.
 * Enforces strict safety rules for the PDF Editor workspace and legal documents.
 * Guarantees zero overlap with document processing, download controls, or editing canvases.
 */

export type AdPageType =
  | 'home'
  | 'tool'
  | 'guide'
  | 'resource'
  | 'editor'
  | 'about'
  | 'contact'
  | 'legal';

export type AdPlacement =
  | 'top'
  | 'in-content'
  | 'post-tool'
  | 'mid-content'
  | 'related-tools'
  | 'end-content'
  | 'anchor'
  | 'multiplex';

export type AdFormat = 'auto' | 'horizontal' | 'rectangle' | 'multiplex';

export interface AdPlacementDimensions {
  minHeight: number;
  format: AdFormat;
  label: string;
}

export interface AdStrategyConfig {
  allowedPlacements: AdPlacement[];
  maxAdsPerPage: number;
  enableAnchor: boolean;
  description: string;
}

/**
 * Platform Strategy Configuration Matrix
 * Centralized control: modifying allowed placements here updates all consumers automatically.
 */
export const AD_STRATEGY: Record<AdPageType, AdStrategyConfig> = {
  home: {
    allowedPlacements: ['in-content', 'end-content'],
    maxAdsPerPage: 2,
    enableAnchor: false,
    description: 'Minimal in-content banner separated from hero and primary tool shortcuts.',
  },
  tool: {
    allowedPlacements: ['post-tool', 'end-content'],
    maxAdsPerPage: 2,
    enableAnchor: true,
    description: 'Post-tool banner well below the interactive workspace, plus bottom content slot.',
  },
  guide: {
    allowedPlacements: ['in-content', 'mid-content', 'end-content', 'multiplex'],
    maxAdsPerPage: 3,
    enableAnchor: true,
    description: 'Long-form editorial placements with multiplex recommendations at bottom.',
  },
  resource: {
    allowedPlacements: ['in-content', 'end-content'],
    maxAdsPerPage: 2,
    enableAnchor: false,
    description: 'Separated documentation placements.',
  },
  editor: {
    // STRICT SAFETY: No ads inside the editing canvas, near undo/redo, delete, or download controls.
    // Only allows a single separated slot at the very bottom of the page far below the workspace.
    allowedPlacements: ['end-content'],
    maxAdsPerPage: 1,
    enableAnchor: false, // Absolutely NO anchor ads on editor to preserve bottom workspace/zoom controls
    description: 'Strictly isolated bottom slot far below the interactive editor workspace.',
  },
  about: {
    allowedPlacements: ['end-content'],
    maxAdsPerPage: 1,
    enableAnchor: false,
    description: 'Single bottom placement below company story.',
  },
  contact: {
    allowedPlacements: [],
    maxAdsPerPage: 0,
    enableAnchor: false,
    description: 'Zero advertisements on support and contact forms.',
  },
  legal: {
    allowedPlacements: [],
    maxAdsPerPage: 0,
    enableAnchor: false,
    description: 'Zero advertisements on privacy policy, terms, and cookie policy pages.',
  },
};

/**
 * Standard dimensions by format for Cumulative Layout Shift (CLS) prevention.
 * Reserves exact container space before ad scripts execute.
 */
export const AD_FORMAT_DIMENSIONS: Record<AdFormat, AdPlacementDimensions> = {
  horizontal: {
    minHeight: 90,
    format: 'horizontal',
    label: 'Leaderboard (728x90 / 320x50)',
  },
  rectangle: {
    minHeight: 250,
    format: 'rectangle',
    label: 'Medium Rectangle (300x250 / 336x280)',
  },
  multiplex: {
    minHeight: 280,
    format: 'multiplex',
    label: 'Multiplex Grid (Matched Content)',
  },
  auto: {
    minHeight: 100,
    format: 'auto',
    label: 'Responsive Dynamic Unit',
  },
};

/**
 * Evaluates whether an ad placement is permissible under platform policy.
 */
export function isAdPlacementAllowed(pageType: AdPageType, placement: AdPlacement): boolean {
  const strategy = AD_STRATEGY[pageType];
  if (!strategy) return false;
  return strategy.allowedPlacements.includes(placement);
}

/**
 * Evaluates whether viewport anchor ads are permissible on this page type.
 */
export function isAnchorAllowed(pageType: AdPageType): boolean {
  const strategy = AD_STRATEGY[pageType];
  if (!strategy) return false;
  return strategy.enableAnchor;
}

/**
 * Returns minimum reservation height in pixels to avoid Cumulative Layout Shift.
 */
export function getReservedMinHeight(format: AdFormat = 'auto'): number {
  return AD_FORMAT_DIMENSIONS[format]?.minHeight ?? 100;
}
