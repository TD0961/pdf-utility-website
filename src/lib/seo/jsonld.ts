import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from './metadata';

export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function getToolSoftwareSchema({
  name,
  description,
  url,
  operatingSystem = 'All modern web browsers (Chrome, Safari, Firefox, Edge)',
}: {
  name: string;
  description: string;
  url: string;
  operatingSystem?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${name} — ${SITE_NAME}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem,
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description,
    url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function getArticleSchema({
  title,
  description,
  url,
  publishedDate,
  updatedDate,
}: {
  title: string;
  description: string;
  url: string;
  publishedDate: string;
  updatedDate: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    datePublished: publishedDate,
    dateModified: updatedDate,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}
