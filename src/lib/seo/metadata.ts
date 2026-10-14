import { Metadata } from 'next';
import { siteConfig, SITE_NAME, SITE_URL, SITE_TAGLINE, SITE_DESCRIPTION } from '@/config/site';

export { siteConfig, SITE_NAME, SITE_URL, SITE_TAGLINE, SITE_DESCRIPTION };

export interface PageSeoProps {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
  imageAlt?: string;
}

export function formatTitle(title?: string): string {
  if (!title || !title.trim()) {
    return `${SITE_NAME} — ${SITE_TAGLINE}`;
  }

  const cleanTitle = title.trim();

  // If the title already matches or ends with the site brand suffix, do not append another
  if (
    cleanTitle === SITE_NAME ||
    cleanTitle.endsWith(`| ${SITE_NAME}`) ||
    cleanTitle.endsWith(`— ${SITE_NAME}`) ||
    cleanTitle.endsWith(`- ${SITE_NAME}`)
  ) {
    return cleanTitle;
  }

  return `${cleanTitle} | ${SITE_NAME}`;
}

export function constructMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = '',
  noIndex = false,
  image,
  imageAlt,
}: PageSeoProps = {}): Metadata {
  const fullTitle = formatTitle(title);
  const canonicalUrl = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const defaultImageUrl = `${SITE_URL}/og-image.png`;
  const resolvedImageUrl = image
    ? image.startsWith('http')
      ? image
      : `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`
    : defaultImageUrl;
  const resolvedImageAlt = imageAlt || `${SITE_NAME} — Free & Private In-Browser PDF Tools`;

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
      images: [
        {
          url: resolvedImageUrl,
          width: 1200,
          height: 630,
          alt: resolvedImageAlt,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [resolvedImageUrl],
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
