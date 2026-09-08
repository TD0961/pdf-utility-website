import { Metadata } from 'next';

export const SITE_NAME = 'iLikePDF';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ilikepdf.com';
export const SITE_TAGLINE = 'Simple PDF tools. Private by design.';
export const SITE_DESCRIPTION =
  'Merge, split, convert, rotate, and manage PDF files directly in your browser. Zero backend file processing — 100% private and secure on your device.';

interface PageSeoProps {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}

export function constructMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = '',
  noIndex = false,
}: PageSeoProps = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  const canonicalUrl = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
  };
}
