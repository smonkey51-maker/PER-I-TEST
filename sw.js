/* ATELIER — service worker: apre l'app anche senza rete, i dati restano sul dispositivo */
const CACHE = 'atelier-v26';
const SHELL = ['/', '/index.html', '/style.css', '/wardrobe-experience.css', '/wardrobe-experience.js', '/atelier-tools.js', '/atelier-tools.css', '/atelier-redesign.css', '/atelier-redesign.js', '/atelier-clean.css', '/atelier-inspired.css', '/atelier-dark.css', '/atelier-flat.css', '/atelier-premium.css', '/atelier-v3.css', '/atelier-v3-layout.js', '/atelier-v3-features.js', '/atelier-v3-week.js', '/atelier-v3-features.css', '/atelier-account-hidden.css', '/atelier-i18n.css', '/atelier-i18n.js', '/atelier-ios.css', '/atelier-ios.js', '/atelier-studio.js', '/app.js', '/plan.js', '/drive-sync.js', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/fonts/cormorant-garamond-latin-500-normal.woff2', '/fonts/cormorant-garamond-latin-600-normal.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Prima la rete (così dopo un aggiornamento vedi subito la versione nuova), cache come riserva offline.
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('/index.html')))
  );
});
