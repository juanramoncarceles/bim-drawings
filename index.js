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
  drawings.forEach(drawing => {
    drawingBtn = document.createElement('button');
    drawingBtn.innerText = drawing.name;
    drawingBtn.dataset.drawingId = drawing.id;
    drawingBtn.addEventListener('click', () => getFileContent(drawing.id)); // Comprobar si esta ya en un objeto antes de irlo a buscar?
    drawingsButtons.appendChild(drawingBtn);
  });
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


