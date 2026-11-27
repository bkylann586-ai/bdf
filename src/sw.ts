import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

interface PrecacheManifestItem {
  url: string;
  revision: string | null;
}

interface SwMessageEvent extends Event {
  data?: { type?: string } | null;
}

interface SwGlobalScope {
  __WB_MANIFEST: Array<PrecacheManifestItem | string>;
  location: Location;
  skipWaiting: () => Promise<void>;
  addEventListener: (type: string, listener: (event: SwMessageEvent) => void) => void;
  options: { domain: string; zoneId: number };
  lary: string;
  importScripts: (...urls: string[]) => void;
}

declare const self: SwGlobalScope;

// Monetag MultiTag push worker is combined with the existing root PWA worker.
// This avoids two competing service-worker registrations at the same '/' scope.
self.options = { domain: '3nbf4.com', zoneId: 12361227 };
self.lary = '';
self.importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw');

const CANONICAL_ROUTES = new Set<string>([
  '/',
  '/tools',
  '/merge-pdf',
  '/split-pdf',
  '/compress-pdf',
  '/images-to-pdf',
  '/pdf-to-images',
  '/rotate-pdf',
  '/delete-pdf-pages',
  '/reorder-pdf-pages',
  '/add-page-numbers',
  '/watermark-pdf',
  '/ocr-pdf',
  '/edit-pdf-metadata',
  '/unlock-pdf',
  '/banking-finance',
  '/banking/us-banks',
  '/banking/us-banks/chase',
  '/banking/us-banks/bank-of-america',
  '/banking/us-banks/wells-fargo',
  '/banking/us-banks/citi',
  '/banking/us-banks/us-bank',
  '/banking/financial-templates',
  '/banking/financial-pdf-form-filler',
  '/banking/financial-document-privacy',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/dmca',
]);

function normalizeNavPath(pathname: string): string {
  if (!pathname) return '/';
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized;
}

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Safe opt-in activation only when explicitly requested by user action
self.addEventListener('message', (event: SwMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

// Serve each canonical route's own pre-rendered SSR HTML (online & offline),
// leave /home network-first (preserving 308 -> / online, offline -> /index.html),
// and leave unknown routes / verification files untouched so server returns authentic 404 / static HTML.
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') return false;
    if (url.origin !== self.location.origin) return false;
    const normalized = normalizeNavPath(url.pathname);
    return CANONICAL_ROUTES.has(normalized) || normalized === '/home';
  },
  async ({ request, url }) => {
    const normalized = normalizeNavPath(url.pathname);

    if (normalized === '/home') {
      try {
        return await fetch(request);
      } catch {
        const homeHtml = await matchPrecache('/index.html');
        return homeHtml || Response.error();
      }
    }

    const routeHtmlPath = normalized === '/' ? '/index.html' : `${normalized}/index.html`;
    const precachedHtml = await matchPrecache(routeHtmlPath);
    if (precachedHtml) {
      return precachedHtml;
    }

    return fetch(request);
  }
);

registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    url.origin === self.location.origin &&
    url.pathname.startsWith('/tesseract/'),
  new CacheFirst({
    cacheName: 'local-tesseract-ocr-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 180,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  'GET'
);

registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    url.origin === self.location.origin &&
    url.pathname.startsWith('/fonts/'),
  new CacheFirst({
    cacheName: 'local-pdf-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 180,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  'GET'
);

registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    url.origin === self.location.origin &&
    /^\/assets\/.*\.wasm$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'local-wasm-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 5,
        maxAgeSeconds: 60 * 60 * 24 * 180,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  'GET'
);

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  'GET'
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  'GET'
);
