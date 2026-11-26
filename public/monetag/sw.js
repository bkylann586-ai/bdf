/* Isolated Monetag Push Service Worker (scope: /monetag/).
 * Kept separate from PDFQuick's root /sw.js so offline caching and safe manual PWA updates stay isolated.
 */
self.options = {
  domain: '5gvci.com',
  zoneId: 12336654,
};
self.lary = '';

try {
  importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');
} catch (_err) {
  // Ignore network/ad-blocker failures so worker lifecycle does not throw uncaught errors
}
