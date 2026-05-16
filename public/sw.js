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
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.warn('SW: cache.addAll részben sikertelen:', err))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApi(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function handleApi(request) {
  // Non-GET requests (POST, PATCH, DELETE): forward directly, no caching
  if (request.method !== 'GET') {
    try {
      return await fetch(request);
    } catch (err) {
      console.error('SW: API hálózati hiba:', err);
      return new Response(
        JSON.stringify({ error: 'Hálózati hiba – nem sikerült csatlakozni a szerverhez.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // GET requests: network-first, cache fallback
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('SW: GET API offline, cache-ből szolgál:', request.url);
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Offline – nincs gyorsítótárazott adat.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function handleNavigation(request) {
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
