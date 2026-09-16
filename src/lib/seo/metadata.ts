import { Metadata } from 'next';
import { siteConfig, SITE_NAME, SITE_URL, SITE_TAGLINE, SITE_DESCRIPTION } from '@/config/site';

export { siteConfig, SITE_NAME, SITE_URL, SITE_TAGLINE, SITE_DESCRIPTION };

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
    applicationName: SITE_NAME,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: SITE_NAME,
    },
    formatDetection: {
      telephone: false,
    },
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
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
    other: {
      'google-adsense-account': 'ca-pub-7704232652384788',
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
