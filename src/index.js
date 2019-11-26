import { Application } from './app';
import Generics from './generics';
import API from './api';


/****************** THE ONLY INSTANCE OF THE APP *******************/

const App = new Application();


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
    App.start();
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


/********************* UPLOAD FILE FORM DIALOG *********************/


const uploadFileForm = document.getElementById('uploadFileForm');
const fileInput = document.getElementById('fileInput');
const submitFileBtn = uploadFileForm.querySelector('button[type="submit"]');

// Show the upload project form.
document.getElementById('newProjectBtn').addEventListener('click', () => {
  App.showModalDialog(uploadFileForm);
  App.modalDialogContainer.classList.add('grayTranslucent');
});


// Hide the upload project form.
document.getElementById('closeUploadForm').addEventListener('click', () => {
  App.closeModalDialog(uploadFileForm);
  App.modalDialogContainer.classList.remove('grayTranslucent');
});


// Listen to file input changes.
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    fileInput.nextElementSibling.innerHTML = fileInput.files[0].name;
    submitFileBtn.classList.remove('disabled');
  } else {
    fileInput.nextElementSibling.innerHTML = 'Choose a file';
    submitFileBtn.classList.add('disabled');
  }
});


uploadFileForm.onsubmit = e => {
  e.preventDefault();
  // Set loading state on UI.
  document.getElementById('loadingFile').style.display = 'unset';
  submitFileBtn.classList.add('disabled');
  submitFileBtn.innerHTML = 'Uploading file';
  fileInput.nextElementSibling.style.display = 'none';
  const file = e.target.elements["file"].files[0];
  // TODO: Show some real progress while creating the project.
  API.createProject(file, App, App.lastUploadedProject).then(res => {
    App.updateProjectsList(res);
    App.closeModalDialog(uploadFileForm);
    showMessage('success', 'Project uploaded successfully.');
    fileInput.value = '';
    // Reset upload form UI.
    document.getElementById('loadingFile').style.display = 'none';
    fileInput.nextElementSibling.innerHTML = 'Choose a file';
    submitFileBtn.innerHTML = 'Upload';
    fileInput.nextElementSibling.style.display = 'unset';
  }, err => {
    App.closeModalDialog(uploadFileForm);
    App.updateProjectsList(App.lastUploadedProject);
    console.error(err);
  });
}


/************************ MESSAGE CONTAINER ************************/
/*
 * It is a message that works as a feedback and that doesnt interrupt.
 */


const messageContainer = document.getElementById('messageContainer');

/**
 * Disaplays feedback message.
 * @param {String} message 
 * @param {String} type Use keywords 'success', 'warning' or 'error' to specify the type of message.
 */
function showMessage(type, message) {
  messageContainer.style.display = 'flex';
  messageContainer.querySelector('p').innerText = message;
  switch (type) {
    case 'success':
      messageContainer.classList.add('success');
      break;
    case 'warning':
      messageContainer.classList.add('warning');
      break;
    case 'error':
      messageContainer.classList.add('error');
      break;
  }
}

messageContainer.querySelector('button').addEventListener('click', () => {
  messageContainer.style.display = 'none';
});


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
  const drawingName = currentDrawingBtn.innerText;
  // Set the name of the drawing on the dropdown button.
  App.drawingsBtns.children[0].innerText = drawingName;
  currentDrawingBtn.classList.add('active');
  if (App.workspace.drawings.find(d => d.name === drawingName).content !== undefined) {
    // TODO: Use id instead of name
    App.workspace.setDrawing(drawingName);
  } else {
    App.showViewportDialog('loader', 'Loading drawing');
    API.getFileContent(e.target.dataset.id).then(res => {

      // manageDrawings();
      App.workspace.drawings.find(d => d.id === e.target.dataset.id).setContent(res.body);
      App.workspace.setDrawing(drawingName);

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
              showMessage('success', 'Project deleted successfully');
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