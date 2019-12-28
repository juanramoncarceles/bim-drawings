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


const channel = new BroadcastChannel('app-channel');


// Create notifications with the data value.
// This is only called when the user is not in the webpage.
// Do not set 'notification' fields in the message payload otherwise setBackgroundMessageHandler is not called.
messaging.setBackgroundMessageHandler(payload => {
  console.log('Background message received in sw:', payload);
  const data = payload.data;

  // Notification.
  const title = `${data.author ? data.author : 'Someone'} mentioned you in the project ${data.projectName}.`;
  const options = {
    body: data.text ? (data.text.length <= 100 ? data.text : data.text.substring(0, 97) + '...') : '',
    icon: data.thumb,
    data: { projectId: data.projectId }
  };

  // This is received in the client window.
  channel.postMessage({ action: 'newNotification', content: data });

  return self.registration.showNotification(title, options);
});


// TODO: If I click the notification add it to the list but as already viewed
// TODO: If I dont click add it as pending
// So it should be added always to the list and clicking the notification will remove the this state
// Also always call updateComments which should fecth the new comments.json
self.addEventListener('notificationclick', e => {
  console.log('On notification click: ', e.notification.data.projectId);
  e.notification.close();

  // This looks if the current is already open and focuses if it is.
  e.waitUntil(clients.matchAll({
    type: "window"
  }).then(clientList => {
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url == '/' && 'focus' in client)
        return client.focus();
    }
    if (clients.openWindow)
      return clients.openWindow(`/?id=${e.notification.data.projectId}`);
  }));
});