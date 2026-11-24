// SkipQ Progressive Web App Service Worker (v2)
const CACHE_NAME = 'skipq-pwa-v2';
const PRECACHE_ASSETS = [
  '/',
  '/merchant/register',
  '/manifest.webmanifest',
  '/merchant-manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-merchant-192.png',
  '/icon-merchant-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request) || caches.match('/'))
    );
  }
});
