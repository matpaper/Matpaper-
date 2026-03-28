/* MATPAPER Service Worker — PWA offline support */
var CACHE_NAME = 'matpaper-v1';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/category.css',
  '/wallpaper.css',
  '/about.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/dmca.html',
  '/saved.html',
  '/search.html',
  '/404.html',
  '/manifest.json',
  '/logo.png',
];

/* Install — cache static assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS.map(function(url) {
        return new Request(url, { cache: 'reload' });
      })).catch(function(err) {
        console.log('SW: Cache install error (non-fatal):', err);
      });
    })
  );
  self.skipWaiting();
});

/* Activate — clean old caches */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

/* Fetch — network first, fall back to cache */
self.addEventListener('fetch', function(event) {
  /* Skip non-GET and external requests */
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      /* Cache successful HTML/CSS/JS responses */
      if (response && response.status === 200) {
        var contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html') || contentType.includes('text/css') || contentType.includes('javascript')) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
      }
      return response;
    }).catch(function() {
      /* Offline fallback */
      return caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        /* For HTML navigation, show offline page */
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/404.html');
        }
      });
    })
  );
});
