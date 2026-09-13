/**
 * PDFSimplify — Zero-Backend Service Worker
 * Version: 1.2.0
 * Provides resilient offline functionality, static asset caching, and network fallbacks.
 * After required application assets have been cached, supported tools can continue working offline.
 * Documents and user data are strictly processed in volatile client memory and are NEVER cached.
 */

const CACHE_VERSION = 'v1.2.0';
const STATIC_CACHE = `pdfsimplify-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pdfsimplify-runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/pdf-tools',
  '/pdf-tools/merge-pdf',
  '/pdf-tools/split-pdf',
  '/pdf-tools/organize-pdf',
  '/pdf-tools/rotate-pdf',
  '/pdf-tools/extract-pages',
  '/pdf-tools/jpg-to-pdf',
  '/pdf-tools/pdf-to-jpg',
  '/pdf-tools/pdf-to-text',
  '/pdf-tools/add-page-numbers',
  '/pdf-tools/watermark-pdf',
  '/pdf-tools/protect-pdf',
  '/pdf-tools/unlock-pdf',
  '/pdf-tools/pdf-editor',
  '/pdf-tools/pdf-to-word',
  '/pdf-tools/pdf-to-ppt',
  '/pdf-tools/pdf-to-excel',
  '/pdf-tools/compress-pdf',
  '/pdf-tools/ocr-pdf',
  '/pdf-tools/sign-pdf',
  '/pdf-tools/fill-pdf',
  '/pdf-tools/crop-pdf',
  '/pdf-tools/compare-pdf',
  '/pdf-tools/pdf-to-csv',
  '/pdf-tools/pdf-to-markdown',
  '/pdf-tools/extract-images',
  '/pdf-tools/flatten-pdf',
  '/pdf-tools/remove-pdf-metadata',
  '/pdf-tools/resize-pdf',
  '/pdf-tools/grayscale-pdf',
  '/pdf-tools/header-footer',
  '/guides',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms',
  '/cookie-policy',
  '/pdf.worker.min.mjs',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

// 1. Install Event: Pre-cache core application shell and PDF worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Resilient pre-caching: each asset fetched independently so one missing asset does not break installation
      const cachePromises = STATIC_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response && response.ok) {
            await cache.put(url, response);
          }
        } catch (err) {
          // Log warning but continue pre-caching remaining assets
          console.warn(`[SW] Failed to pre-cache ${url}:`, err);
        }
      });
      await Promise.all(cachePromises);
    })
  );
});

// 2. Activate Event: Clean up stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (name) =>
                (name.startsWith('ilikepdf-') || name.startsWith('pdfsimplify-')) &&
                name !== STATIC_CACHE &&
                name !== RUNTIME_CACHE
            )
            .map((name) => {
              console.log(`[SW] Pruning old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intelligent routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests, non-HTTP(S) protocols, and browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Never intercept blob URLs or internal object streams
  if (url.protocol === 'blob:') {
    return;
  }

  // HTML Navigation Requests: Network-first with offline cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // Check if exact path or fallback is in cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to home page or cached static routes
          const homeFallback = await caches.match('/');
          if (homeFallback) {
            return homeFallback;
          }
          return new Response('Offline: Page unavailable. Please reconnect to the internet.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // Static Assets & Worker Files: Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.mjs') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname === '/pdf.worker.min.mjs';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // Default: Cache with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseToCache));
          }
          return response;
        })
      );
    })
  );
});

// 4. Message Event: Handle skipWaiting or cache management commands
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
