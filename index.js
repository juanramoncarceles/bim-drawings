/**************** GLOBAL OBJECTS TO STORE APP DATA *****************/

// Global object to store application data while it is running.
const appData = {
  appMainFolderId: undefined,
  projectsData: undefined,
  appSettingsFolderId: undefined,
  thumbsFolderId: undefined
}

// Global object to store all the contents of the last uploaded project.
const lastUploadedProject = {
  id: undefined,
  name: undefined,
  drawings: {},
  elementsData: {}
}

// Global object that stores the data of the current project.
const currentProject = {
  id: undefined,
  name: undefined,
  index: undefined, // Index in the appData.projectsData array
  drawings: {},
  elementsData: {}
}


/*********************** GENERIC FUNCTIONS ***********************/

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

/**
 * Removes all the childs of the HTML element.
 * @param {HTMLElement} node 
 */
function emptyNode(node) {
  while (node.firstChild && node.removeChild(node.firstChild));
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


/********************* MODAL DIALOGS MANAGEMENT ********************/

// All modal dialogs are stored in a container and fetched when needed.

const modalDialogContainer = document.getElementById('modalDialogContainer');
const modalDialogsStorage = document.getElementById('modalDialogsStorage');

/**
 * Shows the modal dialog provided from the same document.
 * @param {HTMLElement} dialog Reference to the outer HTML element of the dialog.
 */
function showModalDialog(dialog) {
  modalDialogContainer.appendChild(dialog);
  modalDialogContainer.style.display = 'flex';
}

/**
 * Hides the modal dialog provided from the same document.
 * @param {HTMLElement} dialog Reference to the outer HTML element of the dialog.
 */
function closeModalDialog(dialog) {
  modalDialogContainer.style.display = 'none';
  modalDialogsStorage.appendChild(dialog);
}


/************************ THE PROJECTS LIST ************************/

const projectsListContainer = document.getElementById('projectsListContainer');
const projectsList = document.getElementById('projectsList');
const projectsListBtn = document.getElementById('projectsListBtn');
const closeProjectsListBtn = document.getElementById('closeProjectsListBtn');

/**
 * Create an HTML element with the project data provided.
 * @param {Object} projData Object with name, id and optional thumbId entries.
 */
function createProjectItem(projData) {
  const projItem = document.createElement('button');
  // Projects that have been uploaded but not send to the backend have an id of 'temporal'.
  if (projData.id === 'temporal') {
    projItem.classList.add('unsync');
  }
  projItem.dataset.projId = projData.id;
  projItem.dataset.name = projData.name;
  projItem.classList.add('projectItem');
  let projItemContent;
  if (projData.thumbId) {
    projItemContent = `<img src='https://drive.google.com/uc?id=${projData.thumbId}'>`;
  } else {
    projItemContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -50 350 210"><path d="M143,10.44H65.27V7a7,7,0,0,0-7-7H7A7,7,0,0,0,0,7V103a7,7,0,0,0,7,7H65V70.18H85V110h58a7,7,0,0,0,7-7V17.41A7,7,0,0,0,143,10.44ZM125,53.49H105v-20h20Z" style="fill:#e6e6e6"/></svg>`;
  }
  projItem.innerHTML = projItemContent.concat(`<h4>${projData.name}</h4>`);
  return projItem;
}

/**
 * Receives an array of projects data and creates and appends the HTML items.
 * @param {Array} projectsData The project objects with the name, id and optional thumbId entries.
 */
function createHTMLProjectsList(projectsData) {
  projectsData.forEach(proj => {
    const projectItem = createProjectItem(proj);
    projectsList.appendChild(projectItem);
  });
  adjustItems();
}

/**
 * Shows the list of projects container and fetches projects if required.
 */
function showProjectsList() {
  console.log('Show the projects list.');
  if (currentProject.id) {
    closeProjectsListBtn.style.display = 'unset';
  }
  projectsListContainer.style.display = 'block';
  // If there is no projectsData in the appData object or if there is only one fetch projects.
  if (appData.projectsData === undefined || appData.projectsData.length <= 1) {
    showViewportDialog('loader', 'Loading projects.');
    listProjectItems().then(res => {
      createHTMLProjectsList(res);
      hideViewportMessage();
    });
  }
}

projectsListBtn.addEventListener('click', showProjectsList);

closeProjectsListBtn.addEventListener('click', () => {
  projectsListContainer.style.display = 'none';
});

/**
 * Adjusts the position of project items in the container.
 */
function adjustItems() {
  const itemsH = getComputedStyle(projectsList).getPropertyValue('--items-h');
  const itemsTotal = projectsList.children.length;
  projectsList.style.setProperty('--remaining-items', (Math.ceil(itemsTotal / itemsH) * itemsH) - itemsTotal);
}

window.onresize = adjustItems;

let previousActiveItem;

projectsList.addEventListener('click', e => {
  const projectItem = e.target.closest('[data-proj-id]');
  if (projectItem === null) {
    return;
  }
  // If it is the current project close the list window.
  if (projectItem.dataset.projId === currentProject.id) {
    projectsListContainer.style.display = 'none';
    return;
  }
  // TODO: If there have been changes in the project ask to save or discard them before closing it.
  // TODO: If it was an offline project try to sync it before closing it. The id would be 'temporal' and the contents in currentProject
  if (projectItem.dataset.projId === lastUploadedProject.id) {
    if (lastUploadedProject.id === 'temporal') {
      console.log('Show a message indicating that the project can be accessed but in viewer mode because it couldnt be saved.');
    }
    goToProject(lastUploadedProject);
    if (previousActiveItem) {
      previousActiveItem.classList.remove('current');
    }
    projectItem.classList.add('current');
    previousActiveItem = projectItem;
    projectsListBtn.style.display = 'unset';
  } else {
    showViewportDialog('loader', `Loading project ${projectItem.dataset.name}`);
    fetchProject(projectItem.dataset.projId)
      .then(res => {
        goToProject(res);
        if (previousActiveItem) {
          previousActiveItem.classList.remove('current');
        }
        projectItem.classList.add('current');
        previousActiveItem = projectItem;
        projectsListBtn.style.display = 'unset';
        hideViewportMessage();
      }, err => {
        console.log(err);
      });
  }
});

/**
 * Sets the workspace with the provided project.
 * @param {Object} project Data of the project. Id, name, drawings ids and elementsData files ids.
 */
function goToProject(project) {
  createWorkspace(project);
  projectsListContainer.style.display = 'none';
  history.replaceState({ projectTitle: project.name }, project.name, "?id=" + project.id); // encodeURIComponent ? use pushState() ?
}

/**
 *  Adds a new HTML element item to the list of projects.
 * @param {Object} projData Object with name, id and optional thumbId entries.
 */
function updateProjectsList(projData) {
  const projectItem = createProjectItem(projData);
  projectsList.prepend(projectItem);
  adjustItems();
}


/************************** LOGIN DIALOG ***************************/

const authorizeDialog = document.getElementById('authorizeDialog');

/**
 * Shows the login dialog and hides and clears anything else.
 */
function showLoginDialog() {
  showModalDialog(authorizeDialog);
  // Hide anything else.
  document.querySelector('header').style.display = 'none';
  document.querySelector('main').style.display = 'none';
  projectsListContainer.style.display = 'none';
  // TODO: Delete the contents of the global objects if any.
  // appData.clear();
  // currentProject.clear();
  // lastUploadedProject.clear();
  emptyNode(projectsList);
  history.replaceState({ page: 'Sign in dialog' }, 'Sign in dialog', location.href.replace(location.search, ''));
}


/********************* UPLOAD FILE FORM DIALOG *********************/

const uploadFileForm = document.getElementById('uploadFileForm');
const fileInput = document.getElementById('fileInput');
const submitFileBtn = uploadFileForm.querySelector('button[type="submit"]');

// Show the upload project form.
document.getElementById('newProjectBtn').addEventListener('click', () => {
  showModalDialog(uploadFileForm);
  modalDialogContainer.classList.add('grayTranslucent');
});

// Hide the upload project form.
document.getElementById('closeUploadForm').addEventListener('click', () => {
  closeModalDialog(uploadFileForm);
  modalDialogContainer.classList.remove('grayTranslucent');
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
  submitFileBtn.innerHTML = 'Uploading file.';
  fileInput.nextElementSibling.style.display = 'none';
  const file = e.target.elements["file"].files[0];
  // TODO: Show some real progress while creating the project.
  createProject(file).then(res => {
    updateProjectsList(res);
    closeModalDialog(uploadFileForm);
    showMessage('Project uploaded successfully.', 'success');
    // Reset upload form UI.
    document.getElementById('loadingFile').style.display = 'none';
    fileInput.nextElementSibling.innerHTML = 'Choose a file'
    submitFileBtn.innerHTML = 'Upload';
    fileInput.nextElementSibling.style.display = 'unset';
  }, err => {
    closeModalDialog(uploadFileForm);
    updateProjectsList(lastUploadedProject);
    console.error(err);
  });
}


/************************ MESSAGE CONTAINER ************************/

// It is a message that works as a feedback and that doesnt interrupt.

const messageContainer = document.getElementById('messageContainer');

/**
 * Disaplays feedback message.
 * @param {String} message 
 * @param {String} type Use keywords 'success', 'warning' or 'error' to specify the type of message.
 */
function showMessage(message, type) {
  messageContainer.style.display = 'flex';
  const textContainer = document.createElement('p');
  textContainer.innerHTML = message;
  messageContainer.appendChild(textContainer);
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


/************************ VIEWPORT MESSAGE ************************/

// Message on the middle of the viewport that interrupts.

const viewportMessage = document.getElementById('viewportMessage');

/**
 * Manages the creation of a message on the viewport.
 * @param {String} type Values 'loader' or 'action'. If action an object with a function reference and a name should be provided.
 * @param {String} message 
 * @param {Object} action Object with name and function entries.
 */
function showViewportDialog(type, message, action) {
  if (viewportMessage.querySelector('button')) {
    viewportMessage.querySelector('button').onclick = null;
  }
  emptyNode(viewportMessage);
  // Create the new content.
  const innerContainer = document.createElement('div');
  if (type === 'loader') {
    innerContainer.innerHTML = `<p>${message}</p><img src="assets/loader.gif">`;
  } else if (type === 'action') {
    innerContainer.innerHTML = `<p>${message}</p>`;
    const button = document.createElement('button');
    button.innerHTML = action.name;
    button.classList.add('buttonBase', 'light');
    button.onclick = action.function;
    innerContainer.appendChild(button);
  }
  viewportMessage.appendChild(innerContainer);
  viewportMessage.classList.add('active');
}

/**
 * Hides the viewport message if visible.
 */
function hideViewportMessage() {
  viewportMessage.classList.remove('active');
}


/********************** WORKSPACES MANAGEMENT **********************/

/**
 * Prepares the workspace by cleaning the previous one and setting the currentProject variable.
 * @param {Object} projectData Object with id, name, drawings and elementsData of the project.
 */
function createWorkspace(projectData) {
  cleanWorkspace();
  // Reset the value of the currentProject variable, deletes the contents of the previous project.
  currentProject.name = projectData.name;
  currentProject.id = projectData.id;
  currentProject.index = appData.projectsData.findIndex(obj => obj.name === projectData.name);
  if (projectData.id === lastUploadedProject.id) {
    currentProject.drawings = lastUploadedProject.drawings;
    currentProject.elementsData = lastUploadedProject.elementsData;
  } else {
    currentProject.drawings = {};
    currentProject.elementsData = {};
  }
  // Set title of the project in the button to list the projects.
  projectsListBtn.innerText = projectData.name;
  createDrawignsBtns(projectData.drawings);
}

const drawingsContainer = document.getElementById('drawingsContainer');
const drawingsBtns = document.getElementById('drawingsBtns');

/**
 * Cleans the workspace by emptying the drawing container and the list of drawings.
 * TODO: Remove possible event listeners before emptying containers ?
 */
function cleanWorkspace() {
  // TODO: remove the click eventListener of the buttons before deleting them or place just one eventListener in the drawingsBtns container
  emptyNode(drawingsBtns);
  // TODO: If in future version there are elements in the svg with event listeners those should be deleted
  drawingsContainer.innerHTML = '';
}

/**
 * Creates the buttons for the drawings to be displayed.
 * @param {Object} drawings Object with the drawings, each entry has the name as key.
 */
function createDrawignsBtns(drawings) {
  for (const drawingName in drawings) {
    drawingBtn = document.createElement('button');
    drawingBtn.innerText = drawingName;
    // Could be that there is no id if the project was uploaded and it is only local.
    if (drawings[drawingName].id) {
      drawingBtn.dataset.drawingId = drawings[drawingName].id;
    }
    drawingBtn.addEventListener('click', () => { // TODO: extract to a function to remove it or place one in the parent
      if (currentProject.drawings[drawingName]) {
        setDrawing(drawingName);
      } else {
        showViewportDialog('loader', 'Loading drawing.');
        getFileContent(drawings[drawingName].id).then(res => {
          currentProject.drawings[drawingName] = res.body;
          hideViewportMessage();
          setDrawing(drawingName);
          console.log('Drawing fetched.');
        }, err => {
          console.log(err);
        });
      }
    });
    drawingsBtns.appendChild(drawingBtn);
  }
}

// TODO: These should be properties of the currentProject object
const appendedDrawingsName = [];
let selectedElementId;
let currentDrawing; // Reference to the div container with the drawing

/**
 * Places the content of the svg drawing in the container.
 * @param {String} drawingName 
 */
function setDrawing(drawingName) {
  //drawingsContainer.innerHTML = currentProject.drawings[drawingName];

  // If there is a visible drawing hide it.
  if (currentDrawing && currentDrawing.dataset.name !== drawingName) {
    if (selectedElementId && currentDrawing.querySelector('[data-id="' + selectedElementId + '"]')) {
      currentDrawing.querySelector('[data-id="' + selectedElementId + '"]').classList.remove('selected');
    }
    currentDrawing.style.display = 'none';
  } else if (currentDrawing && currentDrawing.dataset.name === drawingName) {
    return;
  }

  // If it is not in the container already append it. It will be visible.
  if (!appendedDrawingsName.includes(drawingName)) {
    appendedDrawingsName.push(drawingName);
    const container = document.createElement('div');
    container.dataset.name = drawingName;
    container.innerHTML = currentProject.drawings[drawingName];
    drawingsContainer.append(container);
    currentDrawing = container;
  } else {
    currentDrawing = drawingsContainer.querySelector('div[data-name="' + drawingName + '"]');
    currentDrawing.style.display = 'unset';
  }

  if (selectedElementId && currentDrawing.querySelector('[data-id="' + selectedElementId + '"]')) {
    currentDrawing.querySelector('[data-id="' + selectedElementId + '"]').classList.add('selected');
  }

}


/************************* SELECT ELEMENTS *************************/

drawingsContainer.addEventListener('click', e => {
  const clickedElement = e.target.closest('[selectable]');
  if (clickedElement) {
    if (!selectedElementId) {
      clickedElement.classList.add('selected');
      showElementData(clickedElement.dataset.category, clickedElement.dataset.id);
      selectedElementId = clickedElement.dataset.id;
    } else if (clickedElement.dataset.id !== selectedElementId) {
      if (currentDrawing.querySelector('[data-id="' + selectedElementId + '"]')) {
        currentDrawing.querySelector('[data-id="' + selectedElementId + '"]').classList.remove('selected');
      }
      clickedElement.classList.add('selected');
      showElementData(clickedElement.dataset.category, clickedElement.dataset.id);
      selectedElementId = clickedElement.dataset.id;
    }
  } else if (selectedElementId) {
    if (currentDrawing.querySelector('[data-id="' + selectedElementId + '"]')) {
      currentDrawing.querySelector('[data-id="' + selectedElementId + '"]').classList.remove('selected');
    }
    selectedElementId = undefined;
  }
});


function showElementData(category, id) {
  if (currentProject.elementsData[category]) {
    console.log(currentProject.elementsData[category].instances[id]);
  } else {
    // show a loader in the table ?
    categoryData = appData.projectsData[currentProject.index].elementsData.find(obj => obj.name.replace('.json', '') === category);
    getFileContent(categoryData.id).then(res => {
      currentProject.elementsData[category] = JSON.parse(res.body);
      // hide the possible loader ?
      console.log(currentProject.elementsData[category].instances[id]);
      console.log('Element data fetched.');
    }, err => {
      console.log(err);
    });
  }
}


/************************ SIDE NAVE MENU ***************************/

const sideNavToggle = document.getElementById('sideNavToggle');

sideNavToggle.addEventListener('click', () => {
  document.getElementById('sideNavContainer').classList.toggle('active');
  sideNavToggle.classList.toggle('active');
});


/************************ START APPLICATION ************************/

/**
 * Function called at start and behaves differently depending if the url contains an id of a project or not.
 */
function startApp() {
  // Hide the login dialog in case it was visible.
  closeModalDialog(authorizeDialog);
  // Show the app interface.
  document.querySelector('header').style.display = 'flex';
  document.querySelector('main').style.display = 'block';
  // Get the URL params.
  const resourceId = getUrlParams(window.location.href).id;
  if (resourceId) {
    showViewportDialog('loader', 'Loading project.');
    fetchProject(resourceId)
      .then(res => {
        createWorkspace(res);
        projectsListBtn.style.display = 'unset';
        hideViewportMessage();
      }, rej => {
        console.log(JSON.parse(rej.body).error.code);
        if (JSON.parse(rej.body).error.code === 404) {
          showViewportDialog('action', JSON.parse(rej.body).error.message, {
            name: 'View projects list', function: () => {
              showProjectsList();
              if (location.search !== "") {
                history.replaceState({ page: 'Projects list' }, 'Projects list', location.href.replace(location.search, ''));
              }
            }
          });
        } else {
          console.log(rej.body);
        }
      });
  } else {
    // Delete any invalid search parameter if any.
    if (location.search !== "") {
      history.replaceState({ page: 'Projects list' }, 'Projects list', location.href.replace(location.search, ''));
    }
    projectsListContainer.style.display = 'block';
    showViewportDialog('loader', 'Loading projects.');
    // TODO: Limit the number of projects to list
    listProjectItems().then(res => {
      createHTMLProjectsList(res);
      hideViewportMessage();
    });
  }
}




