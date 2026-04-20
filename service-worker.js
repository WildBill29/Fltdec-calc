const CACHE = 'flightdeck-v8';
const BASE = '/Fltdec-calc/';
const FILES = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(FILES)
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE).then(async cache => {
      // Try exact match
      let cached = await cache.match(event.request);
      if (cached) return cached;

      // Try base path fallback
      cached = await cache.match(self.location.origin + BASE);
      if (cached) return cached;

      // Try network and cache result
      try {
        const response = await fetch(event.request);
        if (response && response.status === 200) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        // Offline fallback
        return cache.match(self.location.origin + BASE + 'index.html');
      }
    })
  );
});
