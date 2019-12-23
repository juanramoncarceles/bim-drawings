'use strict';


// CODELAB: Update cache names any time any of the cached files change.
const CACHE_NAME = 'static-cache-v1';


// Add list of files to cache here.
// For example a page when there is no internet conection.
const FILES_TO_CACHE = [
  // '/offline.html',
];


self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  // Static resources are precached here.
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});


// The 'activate' event is used to clean old data in cache.
// For this to work first increment the name of 'CACHE_NAME' above
// and then will be called when any of the app shell files change.
self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  // Remove previous cached data from disk.
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});


// This fetch handler is only for page navigation fetches.
// For example if someone access and there is no internet.
self.addEventListener('fetch', (evt) => {
  console.log('[ServiceWorker] Fetch', evt.request.url);
  if (evt.request.mode !== 'navigate') {
    return;
  }
  evt.respondWith(
    fetch(evt.request)
      .catch(() => {
        return caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.match('offline.html');
          });
      })
  );
});
