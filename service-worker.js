const CACHE = 'tristeza-v12';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // Cache core files individually so one failure doesn't break everything
      Promise.allSettled([
        c.add('./index.html'),
        c.add('./manifest.json'),
        c.add('./icon-192.png'),
        c.add('./icon-512.png'),
        c.add('./bg.jpg'),
        c.add('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'),
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
