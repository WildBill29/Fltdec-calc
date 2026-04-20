const CACHE = 'flightdeck-v7';
const ORIGIN = self.location.origin;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      fetch(ORIGIN + '/index.html', { cache: 'no-store' })
        .then(response => {
          cache.put(ORIGIN + '/', response.clone());
          cache.put(ORIGIN + '/index.html', response.clone());
          return cache.put(new Request(ORIGIN + '/'), response);
        })
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
      // Try exact match first
      let cached = await cache.match(event.request);
      if (cached) return cached;

      // Try stripping query strings
      const url = new URL(event.request.url);
      url.search = '';
      cached = await cache.match(url.toString());
      if (cached) return cached;

      // Fall back to root
      cached = await cache.match(ORIGIN + '/');
      if (cached) return cached;
      cached = await cache.match(ORIGIN + '/index.html');
      if (cached) return cached;

      // Nothing cached — try network
      try {
        const response = await fetch(event.request);
        if (response && response.status === 200) {
          cache.put(event.request, response.clone());
          cache.put(ORIGIN + '/', response.clone());
          cache.put(ORIGIN + '/index.html', response.clone());
        }
        return response;
      } catch {
        return new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
      }
    })
  );
});
