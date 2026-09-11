/**
 * iLikePDF — Centralized Site & Domain Configuration
 * Single source of truth for domain, origin URLs, brand metadata, and administrative contacts.
 * Modifying the domain or setting NEXT_PUBLIC_SITE_URL automatically updates all SEO tags,
 * canonical links, sitemap entries, robots.txt directives, and contact channels.
 */

export interface SiteConfig {
  name: string;
  shortName: string;
  domain: string;
  url: string;
  tagline: string;
  description: string;
  supportEmail: string;
  privacyEmail: string;
  copyrightYear: number;
  companyName: string;
  social: {
    github?: string;
    twitter?: string;
  };
}

const DEFAULT_DOMAIN = 'ilikepdf.com';
const RESOLVED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || `https://${DEFAULT_DOMAIN}`;

export const siteConfig: SiteConfig = {
  name: 'iLikePDF',
  shortName: 'iLikePDF',
  domain: DEFAULT_DOMAIN,
  url: RESOLVED_ORIGIN,
  tagline: 'Simple PDF tools. Private by design.',
  description:
    'Merge, split, convert, rotate, and manage PDF files directly in your browser. Zero backend file processing — private, client-side document utilities.',
  supportEmail: `support@${DEFAULT_DOMAIN}`,
  privacyEmail: `privacy@${DEFAULT_DOMAIN}`,
  copyrightYear: 2026,
  companyName: 'iLikePDF',
  social: {
    github: 'https://github.com/ilikepdf/pdf-utility-website',
  },
};

// Convenience re-exports for backwards compatibility across existing modules
export const SITE_NAME = siteConfig.name;
export const SITE_URL = siteConfig.url;
export const SITE_DOMAIN = siteConfig.domain;
export const SITE_TAGLINE = siteConfig.tagline;
export const SITE_DESCRIPTION = siteConfig.description;
