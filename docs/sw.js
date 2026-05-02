const CACHE = 'toolkit-v2';

// Solo pre-cacheamos assets estáticos que no cambian seguido — NO index.html
const STATIC = [
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting()) // Activar nuevo SW sin esperar tabs cerradas
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()) // Tomar control de todas las tabs abiertas
  );
});

self.addEventListener('fetch', e => {
  // ── NETWORK FIRST para navegación (index.html) ──
  // Siempre intenta traer la versión más nueva de la red.
  // Si está offline, cae al caché.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Guardar en caché para uso offline futuro
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // ── CACHE FIRST para assets estáticos (fonts, manifest) ──
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.url.startsWith('http')) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
