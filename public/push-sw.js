self.options = {
  domain: '5gvci.com',
  zoneId: 12336654,
};
self.lary = '';

try {
  importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');
} catch (_err) {
  // Preserve offline PWA functionality if offline or external script is blocked
}
