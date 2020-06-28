import './styles/styles.scss';
import { Application } from './app';
import Generics from './generics';
import API from './api';
import { Messaging } from './messaging';
import { Drawing } from './drawing';


/************************ THE GLOBAL OBJECT ************************/

declare global {
  interface Window {
    thereIsMessaging: boolean;
    getCurrentUser(): gapi.client.drive.User;
    saveMessagingDeviceToken(): void;
  }
}

// declare global {
//   namespace NodeJS {
//     interface ProcessEnv {
//       // PROCESS: string;
//     }
//   }
// }


/****************** THE ONLY INSTANCE OF THE APP *******************/

const App = new Application();


/****** THE ONLY INSTANCE OF THE MESSAGING LOGIC BY FIREBASE *******/

const Msg = new Messaging(App);

// Set to true only if the Messaging instance is created.
window.thereIsMessaging = true;


/******************* SERVICE WORKER REGISTRATION *******************/

// TODO: Do this only if the user authenticates?
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('Service worker registered.', reg);
        // Firebase messaging requires to use a service worker.
        if (window.thereIsMessaging) Msg.messaging.useServiceWorker(reg);
      })
      .catch(err => {
        console.error('Service Worker Error', err);
      });
  });
}


/************************* GLOBAL METHODS **************************/

window.getCurrentUser = function () {
  return App.userInfo;
}


/************************ BROADCAST CHANNEL *************************
 * To comunicate with the Service Worker and viceversa.
*/

if (window.BroadcastChannel) {
  const broadCastChannel = new BroadcastChannel('app-channel');

  broadCastChannel.onmessage = e => {
    if (e.data.action === 'newNotification') {
      console.log('Add notification to the list.');
      App.notificationsManager.createNotificaction(e.data.content);
    }
  };
} else {
  console.warn('This browser does not support BroadcastChannel.');
}


/******************* VIEW SAMPLE PROJECT OPTION ********************/

const sampleProjectBtn = document.getElementById('sampleProjectBtn');

sampleProjectBtn.onclick = () => {
  document.getElementById('projectsListBtn').onclick = null;
  App.saveBtn.style.visibility = 'hidden';
  App.projectsListBtn.classList.add('locked');
  // TODO: Change the Sign Out button for the Log In button on the side menu.
  App.start('1D4ESY97zKvJoZ1BWeLWYq8GxhQNWsXpg');
}


/******************* GOOGLE DRIVE AUTHENTICATION *******************/

// OAuth 2.0 Client ID for Google APIs.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// API key for Google Drive.
let API_KEY: string;
if (process.env.PROCESS === 'production') { // TODO work ? or leave just PROCESS ?
  API_KEY = process.env.GOOGLE_API_KEY_PROD;
} else {
  API_KEY = process.env.GOOGLE_API_KEY_DEV;
}

// Array of API discovery doc URLs for APIs used by the app.
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/drive";

const authorizeButton = document.getElementById('authorizeBtn');
const signoutButton = document.getElementById('signoutBtn');


/**
 *  On load, called to load the auth2 library and API client library.
 */
(function () {
  const script = document.createElement('script');
  script.type = "text/javascript";
  script.defer = true;
  script.onload = () => handleClientLoad();
  script.src = 'https://apis.google.com/js/api.js';
  document.querySelector('body').appendChild(script);
})();


function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}


/**
 *  Initializes the API client library and sets up sign-in state listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function (error) {
    console.log(JSON.stringify(error, null, 2));
  });
}


/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn: boolean) {
  if (isSignedIn) {
    console.log('Authorized.');
    // Get the URL params.
    const projectId = Generics.getUrlParams(window.location.href).id;
    // Hide the login dialog in case it was visible.
    if (App.modalDialogContent.firstElementChild) {
      App.closeModalDialog();
    }
    // Manage the logged user personal info.
    App.setUserInfo();
    // If a project id is provided to start() method the app will start from the project view.
    App.start(projectId);
  } else {
    console.log('Not authorized');
    showLoginDialog();
  }
}


/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  gapi.auth2.getAuthInstance().signIn();
}


/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}


/************************** LOGIN DIALOG ***************************/


const authorizeDialog = document.getElementById('authorizeDialog');

/**
 * Shows the login dialog and hides and clears anything else.
 */
function showLoginDialog() {
  App.showModalDialog(authorizeDialog, 'opaque', false);
  // Hide anything else.
  document.querySelector('header').style.display = 'none';
  document.querySelector('main').style.display = 'none';
  App.projectsListContainer.style.display = 'none';
  // TODO: Delete the contents of the global objects if any.
  // appData.clear();
  // currentProject.clear();
  // lastUploadedProject.clear();
  Generics.emptyNode(App.projectsList);
  history.replaceState({ page: 'Sign in dialog' }, 'Sign in dialog', location.href.replace(location.search, ''));
}


/************************ PWA installation *************************/
// TODO Create a separate class and import?

let deferredInstallPrompt: BeforeInstallPromptEvent = null;

const installButton = document.getElementById('installBtn');

installButton.addEventListener('click', installApp);


// Event listener for beforeinstallprompt event.
window.addEventListener('beforeinstallprompt', saveBeforeInstallPromptEvent);


/**
 * Event handler for beforeinstallprompt event.
 * Saves the event and shows install button.
 * @param {Event} e
 */
function saveBeforeInstallPromptEvent(e: BeforeInstallPromptEvent) {
  // Prevent from automatically showing the prompt which could happen
  // in some browsers and create a custom one.
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredInstallPrompt = e;
  // Update UI to notify the user they can add to home screen
  installButton.removeAttribute('hidden');
}


/**
 * Event handler for the install button.
 * @param {Event} e
 */
function installApp(e: Event) {
  // Show install prompt.
  deferredInstallPrompt.prompt();
  // Hide the install button, it cant be called twice.
  (e.target as HTMLElement).hidden = true; // TODO use css instead
  // Log user response to prompt.
  deferredInstallPrompt.userChoice
    .then(choice => {
      if (choice.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt', choice);
      } else {
        console.log('User dismissed the A2HS prompt', choice);
      }
      deferredInstallPrompt = null;
    });
}


// Add event listener for the appinstalled event.
// Since app can be installed in more than one way it is good to listen for this event.
window.addEventListener('appinstalled', logAppInstalled);


/**
 * The event handler for the appinstalled event.
 * @param {Event} e
 */
function logAppInstalled(e: Event) {
  console.log('VisualARQ Drawings Viewer was installed.', e);
  // TODO: Log the installation for example to an analytics software or save the event somehow.
}







// TODO move to a separate file

/********************** DRAWINGS BUTTONS LIST **********************/
/*
 * A single event listener in the container of the drawings buttons manages the clicked drawing.
 */

let currentDrawingBtn: HTMLElement;

App.drawingsBtns.querySelector('.dropdown-content').addEventListener('click', async function (e) {
  if (currentDrawingBtn) {
    currentDrawingBtn.classList.remove('active');
  }
  currentDrawingBtn = (e.target as HTMLElement);
  const drawingId = currentDrawingBtn.dataset.id;
  // Set the name of the drawing on the dropdown button.
  // TODO: Do this only if it was successful.
  (App.drawingsBtns.children[0] as HTMLElement).innerText = currentDrawingBtn.innerText;
  currentDrawingBtn.classList.add('active');

  // Get the corresponding drawing object.
  const requestedDrawing = App.currentWorkspace.drawings.find(d => d.id === drawingId);

  // Load the drawings styles if it is the first time.
  // TODO: If this is required always the first time maybe do it in the Workspace constructor.
  // TODO: If this finally extracted then the function wont need to be async anymore.
  if (App.currentWorkspace.drawingsStylesTag === undefined) {
    if (App.currentWorkspace.drawingsStylesId !== undefined) {
      let stylesRes;
      try {
        stylesRes = await API.getFileContent(App.currentWorkspace.drawingsStylesId);
      } catch {
        console.error("Error while trying to fetch the drawings styles.");
      }
      if (stylesRes) {
        const styleTag = document.createElement('style');
        styleTag.innerText = stylesRes.body;
        document.head.appendChild(styleTag);
        App.currentWorkspace.drawingsStylesTag = styleTag;
      }
    } else {
      console.warn('This project doesn\'t have a css styles file for the drawings.');
    }
  }

  // Check if the requested drawing has already the content.
  if (requestedDrawing.content !== undefined) {
    App.currentWorkspace.setDrawing(requestedDrawing);
  } else {
    App.showViewportDialog('loader', 'Loading drawing');
    API.getFileContent(drawingId).then(res => {
      requestedDrawing.setContent(res.body);
      App.currentWorkspace.setDrawing(requestedDrawing);
      App.hideViewportMessage();
      console.log('Drawing fetched.');
    }, err => {
      console.log(err);
    });
  }
});


/********************* DROPDOWNS FUNCTIONALITY *********************/

const dropdowns = document.getElementsByClassName('dropdown-container');

for (let i = 0; i < dropdowns.length; i++) {
  dropdowns[i].children[0].addEventListener('click', () => {
    dropdowns[i].classList.toggle('open');
  });
  dropdowns[i].addEventListener('mouseleave', e => {
    (e.currentTarget as HTMLElement).classList.remove('open');
  });
}


/************************ SIDE NAVE MENU ***************************/

const sideNavToggle = document.getElementById('sideNavToggle');

sideNavToggle.addEventListener('click', () => {
  document.getElementById('sideNavContainer').classList.toggle('active');
  sideNavToggle.classList.toggle('active');
});