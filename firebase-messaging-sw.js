importScripts('https://www.gstatic.com/firebasejs/7.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.6.1/firebase-messaging.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9KC9Q3NzMt7b6TspNcKxqWqnzzPLvdFg",
  authDomain: "testgdproject-1570036439931.firebaseapp.com",
  databaseURL: "https://testgdproject-1570036439931.firebaseio.com",
  projectId: "testgdproject-1570036439931",
  storageBucket: "testgdproject-1570036439931.appspot.com",
  messagingSenderId: "199844453643",
  appId: "1:199844453643:web:4aa7ba97d1ae2e428b560e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Advanced messages with data
// This is only going to be called if the user is not in the webpage
messaging.setBackgroundMessageHandler(payload => {
  const title = 'Hello World';
  const options = {
    body: payload.data.status
  };
  return self.registration.showNotification(title, options);
});