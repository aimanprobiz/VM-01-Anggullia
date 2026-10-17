// sw.js
const CACHE_NAME = 'app-cache-v6'; // Bumped version
const ASSETS = [
  '/',
  '/index.html',
  '/business.html',
  '/manifest.json'
];

// 1. Install & Immediate Takeover
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. Activation & Cleanup of Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
    ])
  );
});

// 3. Optimized Stale-While-Revalidate / Network-First Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker cache completely for all API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // For HTML pages, use Network-First so users always get live updates instantly
  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
    event.respondBy?.() // standard syntax below:
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-First for static assets (styles, images)
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
