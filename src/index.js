import { Application } from './app';
import Generics from './generics';
import API from './api';


/****************** THE ONLY INSTANCE OF THE APP *******************/

const App = new Application();


/******************* VIEW SAMPLE PROJECT OPTION ********************/

const sampleProjectBtn = document.getElementById('sampleProjectBtn');

sampleProjectBtn.onclick = () => {
  document.getElementById('projectsListBtn').removeEventListener('click', App.showProjectsList);
  App.saveBtn.style.visibility = 'hidden';
  App.projectsListBtn.classList.add('locked');
  // TODO: Change the Sign Out button for the Log In button on the side menu.
  App.start('1D4ESY97zKvJoZ1BWeLWYq8GxhQNWsXpg');
}


/************************** AUTHENTICATION *************************/


// Client ID and API key from the Developer Console
const CLIENT_ID = '199844453643-0s921ir25l6rrventemkvr5te5aattej.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDgot_h8p7RzZunGoSDVlKxrpUNN97rPeg';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive';

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
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    console.log('Authorized.');
    // Get the URL params.
    const projectId = Generics.getUrlParams(window.location.href).id;
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
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}


/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}


/************************** LOGIN DIALOG ***************************/


const authorizeDialog = document.getElementById('authorizeDialog');

/**
 * Shows the login dialog and hides and clears anything else.
 */
function showLoginDialog() {
  App.showModalDialog(authorizeDialog);
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


/********************** DRAWINGS BUTTONS LIST **********************/
/*
 * A single event listener in the container of the drawings buttons manages the clicked drawing.
 */

let currentDrawingBtn;

App.drawingsBtns.querySelector('.dropdown-content').addEventListener('click', e => {
  if (currentDrawingBtn) {
    currentDrawingBtn.classList.remove('active');
  }
  currentDrawingBtn = e.target;
  const drawingId = currentDrawingBtn.dataset.id;
  // Set the name of the drawing on the dropdown button.
  App.drawingsBtns.children[0].innerText = currentDrawingBtn.innerText;
  currentDrawingBtn.classList.add('active');

  // Get the corresponding drawing object.
  const requestedDrawing = App.workspace.drawings.find(d => d.id === drawingId);

  // Check if the requested drawing has already the content.
  if (requestedDrawing.content !== undefined) {
    App.workspace.setDrawing(requestedDrawing);
  } else {
    App.showViewportDialog('loader', 'Loading drawing');
    API.getFileContent(drawingId).then(res => {
      requestedDrawing.setContent(res.body);
      App.workspace.setDrawing(requestedDrawing);
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
    e.currentTarget.classList.remove('open');
  });
}


/************************ SIDE NAVE MENU ***************************/

const sideNavToggle = document.getElementById('sideNavToggle');

sideNavToggle.addEventListener('click', () => {
  document.getElementById('sideNavContainer').classList.toggle('active');
  sideNavToggle.classList.toggle('active');
});


/************************* CONTEXT MENU ****************************/

const contextMenu = document.getElementById('contextMenu');
let menuVisible = false;

function toggleMenu(command) {
  contextMenu.style.display = command === "show" ? "block" : "none";
  menuVisible = !menuVisible;
}

function setPosition({ top, left }) {
  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
  toggleMenu("show");
}

window.addEventListener("click", () => {
  if (menuVisible) toggleMenu("hide");
});

window.addEventListener("contextmenu", e => {
  e.preventDefault();
  if (e.target.closest('[data-proj-id]')) {
    // Clean previous content of the context menu.
    contextMenu.querySelector('ul').childNodes.forEach(btn => btn.onclick = null);
    Generics.emptyNode(contextMenu.querySelector('ul'));
    // Get the id of the project.
    const projectItem = e.target.closest('[data-proj-id]');
    // Create the context menu buttons.
    const deleteBtn = document.createElement('li');
    deleteBtn.innerText = 'Delete';
    deleteBtn.onclick = () => {
      App.showViewportDialog('action', `Are you sure you want to delete the ${projectItem.dataset.name} project?`, [
        {
          name: 'Delete',
          function: () => {
            App.showViewportDialog('loader', `Deleting ${projectItem.dataset.name} project.`);
            API.deleteFile(projectItem.dataset.projId).then(res => {
              projectItem.remove();
              const index = App.projectsData.findIndex(proj => proj.id === projectItem.dataset.projId);
              App.projectsData.splice(index, 1);
              // TODO check also if it is in the value of currentProject or lastUploadedProject and delete it as well
              App.hideViewportMessage();
              App.showMessage('success', 'Project deleted successfully');
            });
          }
        },
        {
          name: 'Cancel',
          function: () => {
            App.hideViewportMessage();
          }
        }
      ]);
    };
    contextMenu.querySelector('ul').appendChild(deleteBtn);
    const origin = {
      left: e.pageX,
      top: e.pageY
    };
    setPosition(origin);
  } else {
    if (menuVisible) toggleMenu("hide");
  }
});