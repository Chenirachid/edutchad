const CACHE_NAME = 'educheni-v1';
const FICHIERS_ESSENTIELS = [
  '/',
  '/manifest.json',
  '/icone-192.png',
  '/icone-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FICHIERS_ESSENTIELS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(noms.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Stratégie : réseau d'abord (pour toujours avoir les données à jour),
// et on retombe sur le cache seulement si la connexion échoue (hors-ligne).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Les appels API ne sont jamais mis en cache — toujours des données fraîches.
  if (event.request.url.includes('/api/') || event.request.url.match(/\/(auth|users|notes|absences|creneaux|bulletins|messages)\b/)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie));
        return reponse;
      })
      .catch(() => caches.match(event.request))
  );
});
