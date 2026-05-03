/**
 * AQUASHELL — Service Worker v3.0
 * Offline-first, Cache-first para assets estáticos
 */
const CACHE_NAME = 'aquashell-v3.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/tokens.css',
  '/js/db.js',
  '/js/auth.js',
  '/js/biomassEngine.js',
  '/js/waterQuality.js',
  '/js/sidebar.js',
  '/pages/dashboard.html',
  '/pages/water-quality.html',
  '/pages/feeding.html',
  '/pages/mortality.html',
  '/pages/biometry.html',
  '/pages/inputs.html',
  '/pages/reports.html',
  '/pages/farms.html',
  '/img/aquashell.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => null)));
});
