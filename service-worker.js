importScripts('https://www.gstatic.com/firebasejs/7.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.6.1/firebase-messaging.js');

// The firebase configuration for the app
const firebaseConfig = {
  apiKey: "AIzaSyB9KC9Q3NzMt7b6TspNcKxqWqnzzPLvdFg",
  authDomain: "testgdproject-1570036439931.firebaseapp.com",
  databaseURL: "https://testgdproject-1570036439931.firebaseio.com",
  projectId: "testgdproject-1570036439931",
  storageBucket: "testgdproject-1570036439931.appspot.com",
  messagingSenderId: "199844453643",
  appId: "1:199844453643:web:4aa7ba97d1ae2e428b560e"
};

// Initialization of the Firebase app.
firebase.initializeApp(firebaseConfig);

// An instance of the Firebase Messaging should be retrieved so it can handle background messages.
const messaging = firebase.messaging();

// Used to communicate with the client window.
// Not supported in Safari, check other options:
// https://developer.mozilla.org/en-US/docs/Web/API/MessagePort/postMessage
// https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel
let broadCastChannel;
if (self.BroadcastChannel) {
  console.log('[SW] There is support for BroadcastChannel');
  broadCastChannel = new BroadcastChannel('app-channel');
} else {
  console.warn('[SW] No support for BroadcastChannel');
}


// Create notifications with the data value.
// This is only called when the user is not in the webpage.
// Do not set 'notification' fields in the message payload otherwise setBackgroundMessageHandler is not called.
messaging.setBackgroundMessageHandler(payload => {
  console.log('Background message received in sw:', payload);
  const data = payload.data;

  // The notification content.
  const title = `${data.author ? data.author : 'Someone'} mentioned you in the project ${data.projectName}.`;
  const options = {
    body: data.text ? (data.text.length <= 100 ? data.text : data.text.substring(0, 97) + '...') : '',
    icon: data.photoLink,
    data: { projectId: data.projectId }
  };

  // Only if support for BroadcastChannel was successful.
  if (broadCastChannel) {
    // This is received in the client window.
    broadCastChannel.postMessage({ action: 'newNotification', content: data });
  }

  return self.registration.showNotification(title, options);
});


// TODO: The notification should be always added to the list but if the user clicks on the system
// message then it should be without the pending to read state.
// TODO: Always call updateComments which should fecth the new comments.json
self.addEventListener('notificationclick', e => {
  console.log('[SW] On notification click: ', e.notification.data.projectId);
  e.notification.close();

  // This looks if the current is already open and focuses if it is.
  // Not working, it always opens a new tab.
  e.waitUntil(clients.matchAll({
    type: "window"
  }).then(clientList => {
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url == '/' && 'focus' in client) {
        console.log('[SW] client.focus() executed.');
        return client.focus();
      }
    }
    if (clients.openWindow) {
      console.log('[SW] clients.openWindow() executed.');
      return clients.openWindow(`/?id=${e.notification.data.projectId}`);
    }
  }));
});



// Cache name should be updated any time any of the cached files change.
const CACHE_NAME = 'static-cache-v2';


// Add list of files to cache here.
const FILES_TO_CACHE = [
  '/index.html',
  '/src/styles/styles.css',
  '/dist/main.js',
  '/src/assets/vadv-logo.png',
  '/src/assets/icons/elementDataIcon.svg',
  '/src/assets/icons/commentIcon.svg',
  '/src/assets/icons/hamburgerIcon.svg',
  '/src/assets/icons/crossIcon.svg'
];


self.addEventListener('install', e => {
  console.log('[SW] Install');
  // Static resources are precached here.
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching resources.');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});


// The 'activate' event is used to clean old data in cache.
// For this to work first increment the name of 'CACHE_NAME' above
// and then it will be called when any of the app shell files change.
self.addEventListener('activate', e => {
  console.log('[SW] Activate');
  // Remove previous cached data from disk.
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});


// This fetch handler is only for page navigation fetches.
// For example if someone access and there is no internet.
self.addEventListener('fetch', e => {
  console.log('[SW] Fetch', e.request.url);
  // TODO: Maybe used for other types of fetch resquest modes?
  // TODO: Otherwise it is not very useful on a single page app.
  if (e.request.mode !== 'navigate') {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .catch(() => {
        return caches.open(CACHE_NAME)
          .then(cache => {
            return cache.match('index.html');
          });
      })
  );
});
