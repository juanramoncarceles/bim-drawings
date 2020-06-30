// Firebase App (the core Firebase SDK) is always required and must be listed first.
import * as firebase from "firebase/app";

// The Firebase SDK for Analytics.
import "firebase/analytics";

// The Firebase products that are used for messaging.
import "firebase/firestore";
import "firebase/messaging";

import type { Application } from "./app";

/********************* FIREBASE INITIALIZATION *********************/

// The Firebase configuration for the app.
const firebaseConfig = {
  apiKey: "AIzaSyB9KC9Q3NzMt7b6TspNcKxqWqnzzPLvdFg",
  authDomain: "testgdproject-1570036439931.firebaseapp.com",
  databaseURL: "https://testgdproject-1570036439931.firebaseio.com",
  projectId: "testgdproject-1570036439931",
  storageBucket: "testgdproject-1570036439931.appspot.com",
  messagingSenderId: "199844453643",
  appId: "1:199844453643:web:4aa7ba97d1ae2e428b560e"
};

// Initialization of Firebase.
firebase.initializeApp(firebaseConfig);


/******************** FIREBASE CLOUD MESSAGING **********************
 * Manages the creation of device tokens to receive push notifications.
*/
export class Messaging {
  messaging: firebase.messaging.Messaging;

  constructor(app: Application) {
    // Retrieve the Firebase Messaging object.
    this.messaging = firebase.messaging();

    // Handle incoming messages when the app is in the foreground / focus.
    this.messaging.onMessage(payload => {
      console.log('Message received. ', payload);
      const data = payload.data;
      app.notificationsManager.createNotificaction(data);
    });

    // Callback fired if Instance ID token is updated.
    this.messaging.onTokenRefresh(() => {
      this.messaging.getToken().then(refreshedToken => {
        console.log('FCM token refreshed:', refreshedToken);
        // Send the new Device Token to the datastore.
        firebase.firestore().collection('fcmTokens').doc(refreshedToken)
          .set({ email: app.userInfo.emailAddress });
      }).catch(err => {
        console.log('Unable to retrieve refreshed token ', err);
      });
    });


    /**
     * Auxiliary function to view the device token for FCM.
     */
    window.getMessagingToken = function () {
      firebase.messaging().getToken()
        .then(token => {
          console.log(token);
        })
        .catch(err => {
          console.error(err);
        })
    }

    /**
     * Saves the FCM token to the datastore and session storage.
     * If notification permissions have not been granted it asks for them.
     */
    window.saveMessagingDeviceToken = function () {
      if (!sessionStorage.getItem('deviceToken')) {
        firebase.messaging().getToken().then(token => {
          if (token) {
            console.log('FCM token generated:', token);
            // Saving the FCM token in Firestore.
            firebase.firestore().collection('fcmTokens').doc(token)
              .set({ email: app.userInfo.emailAddress });
            // Saving token in Session Storage.
            sessionStorage.setItem('deviceToken', token);
          } else {
            // Need to request permissions to show notifications.
            this.requestNotificationsPermissions();
          }
        }).catch(err => {
          console.error('Unable to get FCM token.', err);
        });
      }
    }

  }


  /**
   * Requests permission to show notifications.
   */
  requestNotificationsPermissions() {
    console.log('Requesting notifications permission...');
    firebase.messaging().requestPermission().then(() => {
      console.log('Notification permission granted.');
      window.saveMessagingDeviceToken();
    }).catch(err => {
      console.error('Unable to get permission to notify:', err);
    });
  }


  // Equivalent to the previous but without Firebase.
  // function requestPermission() {
  //   console.log('Requesting permission...');
  //   Notification.requestPermission().then(permission => {
  //     if (permission === 'granted') {
  //       console.log('Notification permission granted.');
  //       // TODO: Retrieve an Instance ID token for use with FCM.
  //       // If an app has been granted notification permission it can update its UI reflecting this.
  //       // resetUI();
  //     } else {
  //       console.log('Unable to get permission to notify.');
  //     }
  //   });
  // }  

}