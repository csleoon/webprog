const CACHE_NAME = 'voting-app-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/create-poll.html',
  '/admin.html',
  '/offline.html',
  '/css/style.css',
  '/js/api.js',
  '/js/app.js',
  '/js/auth.js',
  '/js/create-poll.js',
  '/js/admin.js',
  '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirstApi(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request.clone());
    if (response.ok && request.method === 'GET') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline – nincs gyorsítótárazott adat.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function navigationHandler(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(request)) || (await cache.match('/offline.html'));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}
