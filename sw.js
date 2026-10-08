const CACHE_NAME = 'app-cache-v2'; // Bumped version to clear old cache automatically
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install & Immediate Takeover
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force active service worker takeover without waiting for user to close tabs
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. Activation & Cleanup of Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Claim control of all open browser tabs immediately
      self.clients.claim(),
      // Delete old caches (e.g., 'app-cache-v1')
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

// 3. Network-First Strategy for HTML/API, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker cache completely for API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-First for HTML/Documents so updates pull live immediately
  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(event.request)) // Fallback to cache if offline
    );
    return;
  }

  // Cache-First with Network Fallback for other assets (e.g., images, manifest)
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
