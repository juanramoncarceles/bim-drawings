// Object that stores the data of the current project.
const currentProject = {
  id: '',
  name: '',
  drawings: {},
  elementsData: {}
}

/**
* Get the URL parameters.
* Source: https://css-tricks.com/snippets/javascript/get-url-variables/
* @param  {String} url The URL
* @return {Object}     The URL parameters
*/
function getUrlParams(url) {
  const params = {};
  const parser = document.createElement('a');
  parser.href = url;
  const vars = parser.search.substring(1).split('&');
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    params[pair[0]] = decodeURIComponent(pair[1]);
  }
  return params;
}


/********************* MODAL DIALOGS *********************/

// All modal dialogs are stored in a container and fetched when needed.

const modalDialogContainer = document.getElementById('modalDialogContainer');
const modalDialogsStorage = document.getElementById('modalDialogsStorage');

function showModalDialog(dialog) {
  modalDialogContainer.appendChild(dialog);
  modalDialogContainer.style.display = 'flex';
}

function closeModalDialog(dialog) {
  modalDialogContainer.style.display = 'none';
  modalDialogsStorage.appendChild(dialog);
}


// Show the log in dialog

const authorizeDialog = document.getElementById('authorizeDialog');

function showLoginDialog() {
  //document.getElementById('authorize_dialog').style.display = 'flex';
  showModalDialog(authorizeDialog);
  // Also hide or remove anything else (header and main)
  document.querySelector('header').style.display = 'none';
  document.querySelector('main').style.display = 'none';
  projectsList.style.display = 'none';
  // TODO Delete html nodes with data and variables with data
  // Empty the projects list
  const projectsItems = document.getElementById('projects');
  while (projectsItems.firstChild && projectsItems.removeChild(projectsItems.firstChild));
}

/**** UPLOAD FILE FORM ****/
/**************************/

// Show the upload project form
document.getElementById('newProjectBtn').addEventListener('click', () => {
  showModalDialog(uploadFileForm);
  modalDialogContainer.classList.add('grayTranslucent');
});
// Hide the upload project form
document.getElementById('closeUploadForm').addEventListener('click', () => {
  closeModalDialog(uploadFileForm);
  modalDialogContainer.classList.remove('grayTranslucent');
});




const uploadFileForm = document.getElementById('uploadFileForm');
const fileInput = document.getElementById('fileInput');
const submitFileBtn = uploadFileForm.querySelector('button[type="submit"]');

fileInput.addEventListener('change', e => {
  console.log(fileInput.files);
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
  // Set loading state on ui
  document.getElementById('loadingFile').style.display = 'unset';
  submitFileBtn.classList.add('disabled');
  submitFileBtn.innerHTML = 'Uploading file.';
  fileInput.nextElementSibling.style.display = 'none';

  const file = e.target.elements["file"].files[0];
  // TODO Show some real progress while creating the project
  createProject(file).then(res => {
    updateProjectsList(res);
    closeModalDialog(uploadFileForm);
    showMessage('Project uploaded successfully.', 'success');
    // Reset upload form ui
    document.getElementById('loadingFile').style.display = 'none';
    fileInput.nextElementSibling.innerHTML = 'Choose a file'
    submitFileBtn.innerHTML = 'Upload';
    fileInput.nextElementSibling.style.display = 'unset';
  }, err => {
    closeModalDialog(uploadFileForm);
    updateProjectsList(lastUploadedProject);
    // Mostrar el proyecto cargado en la lista pero con un color diferente indicando que es offline?
    console.error(err);
  });
}



/**
 * Read the content of a file.
 * @param {Blob} file 
 */
function readInputFile(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = () => {
      res(reader.result);
    }
    reader.onerror = () => {
      console.log("Error reading the file.");
    }
  });
}

/************ MESSAGE CONTAINER ***************/
/**********************************************/

const messageContainer = document.getElementById('messageContainer');

/**
 * Disaplays feedback message.
 * @param {String} message 
 * @param {String} type Use keywords (success, warning, error) to determine the type of message.
 */
function showMessage(message, type) {
  messageContainer.style.display = 'flex';
  const textContainer = document.createElement('p');
  textContainer.innerHTML = message;
  messageContainer.appendChild(textContainer);
  if (type === 'success') {
    messageContainer.classList.add('success');
  } else if (type === 'warning') {
    messageContainer.classList.add('warning');
  } else if (type === 'error') {
    messageContainer.classList.add('error');
  }
}

messageContainer.querySelector('button').addEventListener('click', () => {
  messageContainer.style.display = 'none';
});

// FIRST FUNCTION THAT IS CALLED ON START


/**
 * Behaves differently depending if the url contains an id of a project or not.
 */
function startApp() {
  // Hide the login dialog in case it was visible
  closeModalDialog(authorizeDialog);
  //document.getElementById('authorize_dialog').style.display = 'none';
  // Show the app interface (header and main)
  document.querySelector('header').style.display = 'flex';
  document.querySelector('main').style.display = 'block';

  // Get the URL params
  const resourceId = getUrlParams(window.location.href).id;

  if (resourceId) {
    manageLoadingMsg(true, 'Loading project.');
    fetchProject(resourceId)
      .then(res => {
        createWorkspace(res);
        projectsListBtn.style.display = 'unset';
        manageLoadingMsg(false);
      }, rej => console.log('Project not found. Go to home?'));
  } else {
    projectsList.style.display = 'block';
    // TODO usar window.location.replace("index.html"); o history.replaceState() para borrar cualquier otro parametro inutil ??
    // TODO: Limit the number of projects to list
    listProjectItems();
    manageLoadingMsg(true, 'Loading projects.');
  }
}

const loadingMessage = document.getElementById('loadingMessage');

function manageLoadingMsg(visible, message) {
  if (visible) {
    loadingMessage.querySelector('p').innerHTML = message;
    loadingMessage.classList.add('active');
  } else if (!visible) {
    loadingMessage.classList.remove('active');
  }
}

function createWorkspace(projectData) {
  cleanWorkspace();
  // Reset the value of the currentProject variable, deletes the contents of the previous project.
  currentProject.name = projectData.name;
  currentProject.id = projectData.id;
  if (projectData.id === lastUploadedProject.id) {
    currentProject.drawings = lastUploadedProject.drawings;
    currentProject.elementsData = lastUploadedProject.elementsData;
  } else {
    currentProject.drawings = {};
    currentProject.elementsData = {};
  }
  // Set title, it will be on the button
  projectsListBtn.innerText = projectData.name;
  // Create buttons for the drawings
  createDrawignsBtns(projectData.drawings);
}

function cleanWorkspace() {
  const drawingsBtns = document.getElementById('tempDrawingsBtns');
  while (drawingsBtns.firstChild && drawingsBtns.removeChild(drawingsBtns.firstChild));
}


// Temporary fucntion to test drawings
function createDrawignsBtns(drawings) {
  const drawingsButtons = document.getElementById('tempDrawingsBtns');
  for (const drawingName in drawings) {
    drawingBtn = document.createElement('button');
    drawingBtn.innerText = drawingName;
    // Could be that there is no id yet if the project was uploaded and it is only local
    if (drawings[drawingName].id) {
      drawingBtn.dataset.drawingId = drawings[drawingName].id;
    }
    drawingBtn.addEventListener('click', () => {
      if (currentProject.drawings[drawingName]) {
        setDrawing(drawingName);
      } else {
        manageLoadingMsg(true, 'Loading drawing.');
        getFileContent(drawings[drawingName].id).then(res => {
          currentProject.drawings[drawingName] = res.body;

          manageLoadingMsg(false);
          setDrawing(drawingName);
          console.log('Drawing fetched.');
        }, err => {
          console.log(err);
        });
      }
    });
    drawingsButtons.appendChild(drawingBtn);
  }
}

const currentDrawingContainer = document.getElementById('currentDrawingContainer');


function setDrawing(drawingName) {
  // Set visible the loading icon
  currentDrawingContainer.innerHTML = currentProject.drawings[drawingName];


}


/***************** THE PROJECTS LIST *****************/

const projectsList = document.getElementById('projectsList');
const projectsListBtn = document.getElementById('projectsListBtn');
const closeProjectsListBtn = document.getElementById('closeProjectsListBtn');

closeProjectsListBtn.addEventListener('click', () => {
  projectsList.style.display = 'none';
});


projectsListBtn.addEventListener('click', () => {
  console.log('Show the projects list.');
  if (currentProject.id) {
    closeProjectsListBtn.style.display = 'unset';
  }
  projectsList.style.display = 'block';
  // Si solo hay uno voy a ver si hay mas ya que posiblemente sea porque se ha accedido directamente a ese proyecto.
  if (appData.projectsData.length <= 1 || appData.projectsData === undefined) {
    listProjectItems();
    manageLoadingMsg(true, 'Loading projects.');
  }
});

// Adjust list last items

const projectsInner = document.getElementById('projects');

window.onresize = calcRemainig;

function calcRemainig() {
  const itemsH = getComputedStyle(projectsInner).getPropertyValue('--items-h');
  const itemsTotal = projectsInner.children.length;
  projectsInner.style.setProperty('--remaining-items', itemsH - (itemsTotal % itemsH));
}





/***************************** SIDE NAVE MENU ********************************/
/*****************************************************************************/

const sideNavToggle = document.getElementById('sideNavToggle');

sideNavToggle.addEventListener('click', () => {
  document.getElementById('sideNavContainer').classList.toggle('active');
  sideNavToggle.classList.toggle('active');
});