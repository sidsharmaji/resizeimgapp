const CACHE_NAME = 'image-tools-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const ASSETS_CACHE = 'assets-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/src/index.css'
];

const OFFLINE_URL = '/offline.html';
const OFFLINE_IMG = '/offline.png';

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(urlsToCache)),
      caches.open(ASSETS_CACHE).then((cache) => cache.add(OFFLINE_IMG)),
      caches.open(DYNAMIC_CACHE)
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // HTML navigation
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL)
          .then(response => response || caches.match(request))
        )
    );
    return;
  }

  // Images
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request)
          .then(response => {
            const clonedResponse = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, clonedResponse));
            return response;
          })
          .catch(() => caches.match(OFFLINE_IMG))
        )
    );
    return;
  }

  // Other resources - Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        const clonedResponse = response.clone();
        caches.open(DYNAMIC_CACHE)
          .then(cache => cache.put(request, clonedResponse));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, ASSETS_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => !currentCaches.includes(cacheName))
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Periodic cache cleanup
setInterval(() => {
  caches.open(DYNAMIC_CACHE).then(cache => {
    cache.keys().then(requests => {
      requests.forEach(request => {
        cache.match(request).then(response => {
          if (response && Date.now() - new Date(response.headers.get('date')).getTime() > 7 * 24 * 60 * 60 * 1000) {
            cache.delete(request);
          }
        });
      });
    });
  });
}, 24 * 60 * 60 * 1000); // Run daily