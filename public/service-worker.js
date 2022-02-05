const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/indexedDB.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'

];
const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(PRECACHE)
            .then((cache) => {
                let cachedAll = cache.addAll(FILES_TO_CACHE)
                console.log("Files were precached successfully", caches, FILES_TO_CACHE)
                return cachedAll;
            })
            .then(()=>{
                self.skipWaiting();
            })
    );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (event) => {
    const currentCaches = [PRECACHE, RUNTIME];
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
            })
            .then((cachesToDelete) => {
                return Promise.all(
                    cachesToDelete.map((cacheToDelete) => {
                        return caches.delete(cacheToDelete);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // if not GET forward off
    if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
        event.respondWith(fetch(event.request))
        return
    }
// GET request sent to api/transaction >> if succeeds cache >> if fail get last cached list and return
    if (event.request.url.includes("/api/transaction")) {
        event.respondWith(
            caches.open(RUNTIME).then((cache) => {
                return fetch(event.request)
                    .then((response) => {
                        cache.put(event.request, response.clone())
                        return response
                    })
                    .catch(() => {
                        return caches.match(event.request)
                    })
            })
        )
        return
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse
            }

            return caches.open(RUNTIME).then((cache) => {
                return fetch(event.request).then((response) => {
                    cache.put(event.request, response.clone())
                    return response
                })
            })
        })
    )
});