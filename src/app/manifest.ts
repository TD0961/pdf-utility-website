import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PDFSimplify — Free & Private In-Browser PDF Suite',
    short_name: 'PDFSimplify',
    description:
      'Simple PDF tools. Private by design. In-browser PDF utilities with zero server uploads.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0f172a',
    theme_color: '#4f46e5',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'PDF Editor',
        short_name: 'Editor',
        description: 'Annotate, draw, sign, and edit PDFs locally',
        url: '/pdf-tools/pdf-editor',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Merge PDF',
        short_name: 'Merge',
        description: 'Combine multiple PDF files into one',
        url: '/pdf-tools/merge-pdf',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Split PDF',
        short_name: 'Split',
        description: 'Extract pages or split by ranges',
        url: '/pdf-tools/split-pdf',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Watermark PDF',
        short_name: 'Watermark',
        description: 'Add text watermarks and stamps',
        url: '/pdf-tools/watermark-pdf',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
