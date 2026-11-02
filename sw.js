// Network first (always the latest version), cache only when offline.
const V = 'evo-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'vendor/matter.min.js', 'icons/icon-192.png', 'icons/icon-512.png',
  ...['ceres', 'moon', 'mercury', 'mars', 'venus', 'earth', 'earth_clouds', 'neptune', 'saturn', 'jupiter', 'sun'].map(n => `assets/textures/${n}.jpg`),
  'assets/textures/saturn_ring.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
