// SMAT Minerals - Sovereign Offline-First Service Worker (Decisión 7-B / GOLD-180)
// Arquitectura PWA Soberana: Network-First para navegación HTML, Cache-First para estáticos versionados.
// Purga determinista de versiones previas en evento 'activate'.

const CACHE_NAME = 'smat-pwa-v3.2'; // Purges smat-pwa-v2.1

const PRECACHE_SHELL = [
  '/',
  '/en/',
  '/catalogo/',
  '/en/catalog/',
  '/diagnostico/',
  '/en/diagnostics/',
  '/garantia/',
  '/en/warranty/',
  '/nosotros/',
  '/en/about/',
  '/contacto/',
  '/en/contact/',
  '/acuse/',
  '/favicon.svg',
  '/favicon.ico',
  '/images/og-card.jpg',
  '/images/logo-smat.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_SHELL).catch(() => {
        // Tolerancia a fallos parciales durante pre-cacheo local
        return Promise.resolve();
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purgando caché obsoleto:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isHtmlNavigation = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isHtmlNavigation) {
    // 1. Estrategia Network-First para HTML: Siempre asegurar la versión más reciente en línea
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Si no hay red, servir la versión en caché de la ruta o fallback a la portada
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return caches.match(url.pathname.startsWith('/en') ? '/en/' : '/');
          });
        })
    );
    return;
  }

  // 2. Estrategia Cache-First para Assets Estáticos Inmutables (/_astro/*, fuentes, imágenes)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return networkResponse;
      });
    })
  );
});
