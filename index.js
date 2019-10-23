// /**
//  * Append a pre element to the body containing the given message
//  * as its text node. Used to display the results of the API call.
//  *
//  * @param {string} message Text to be placed in pre element.
//  */
// function appendPre(message) {
//   const pre = document.getElementById('content');
//   const textContent = document.createTextNode(message + '\n');
//   pre.appendChild(textContent);
// }


const currentProject = {
  name: '',
  drawings: {},
  elementsData: {}
}

/**
* Get the URL parameters.
* source: https://css-tricks.com/snippets/javascript/get-url-variables/
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

const uploadProjectDialog = document.getElementById('uploadProjectDialog');

// Show the upload project form
document.getElementById('add_new_proj_btn').addEventListener('click', () => {
  uploadProjectDialog.style.display = 'flex';
});
// Hide the upload project form
document.getElementById('closeUploadForm').addEventListener('click', () => {
  uploadProjectDialog.style.display = 'none';
});

document.getElementById('uploadFileForm').onsubmit = e => {
  e.preventDefault();
  const file = e.target.elements["file"].files[0];
  // TODO Show some progress while creating the project
  createProject(file).then(res => {
    uploadProjectDialog.style.display = 'none';
    updateProjectsList(res);
  }, err => {
    uploadProjectDialog.style.display = 'none';
    updateProjectsList(lastUploadedProject);
    // Mostrar el proyecto cargado en la lista pero con un color diferente indicando que es offline?
    console.error(err);
  });
}




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



function startApp() {
  // Hide the login dialog in case it was visible
  document.getElementById('authorize_dialog').style.display = 'none';
  // Show the app interface (header and main)
  document.querySelector('header').style.display = 'block';
  document.querySelector('main').style.display = 'block';

  // Get the URL params
  const resourceId = getUrlParams(window.location.href).id;

  if (resourceId) {
    fetchProject(resourceId)
      .then(res => createWorkspace(res));
  } else {
    document.getElementById('projectsList').style.display = 'unset';
    // usar window.location.replace("index.html"); o history.replaceState() para borrar cualquier otro parametro inutil ??
    // TODO: Limit the number of projects to list
    listProjectItems();
  }
}

function createWorkspace(projectData) {
  cleanWorkspace();
  // Reset the value of the currentProject variable, deletes the contents of the previous project.
  if (projectData.id === 'temporal') {
    // Le tendria que pasar tambien el nombre e id?
    currentProject.name = lastUploadedProject.name;
    currentProject.drawings = lastUploadedProject.drawings;
    currentProject.elementsData = lastUploadedProject.elementsData;
  } else {
    currentProject.name = projectData.name;
    currentProject.drawings = {};
    currentProject.elementsData = {};
  }
  // Set title
  document.getElementById('project_title').innerText = projectData.name;
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
  for (const drawing in drawings) {
    drawingBtn = document.createElement('button');
    const drawingName = drawing; //.name.replace(/.svg$/, '');
    drawingBtn.innerText = drawingName;
    // Could be that there is no id yet if the project was uploaded and it is only local
    if (drawings[drawing].id) {
      drawingBtn.dataset.drawingId = drawings[drawing].id;
    }
    drawingBtn.addEventListener('click', () => {
      if (currentProject.drawings[drawingName]) {
        console.log(currentProject.drawings[drawingName]);
      } else {
        getFileContent(drawings[drawing].id).then(res => {
          currentProject.drawings[drawingName] = res.body;
          console.log('fetched');
        }, err => {
          console.log(err);
        });
      }
    });
    drawingsButtons.appendChild(drawingBtn);
  }
}


document.getElementById('projectsListBtn').addEventListener('click', () => {
  console.log('Show the projects list.');
  document.getElementById('projectsList').style.display = 'unset';
  // Si solo hay uno voy a ver si hay mas ya que posiblemente sea porque se ha accedido directamente a ese proyecto.
  if (appData.projectsData.length <= 1 || appData.projectsData === undefined) {
    listProjectItems();
  }
});

// Show the log in dialog
function showLoginDialog() {
  document.getElementById('authorize_dialog').style.display = 'flex';
  // Also hide or remove anything else (header and main)
  document.querySelector('header').style.display = 'none';
  document.querySelector('main').style.display = 'none';
  document.getElementById('projectsList').style.display = 'none';
  // TODO Delete html nodes with data and variables with data
  // Empty the projects list
  const projectsItems = document.getElementById('projects');
  while (projectsItems.firstChild && projectsItems.removeChild(projectsItems.firstChild));
}


