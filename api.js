/****** BASIC GOOGLE API FUNCTIONS ******/

/**
 * Retrieves id and name of the files that match the query object.
 * @param {Object} query Object with optional entries: name (str), parentId (str), trashed (bool), excludeName (str), and onlyFolder (bool)
 */
function listFiles(query) {
  const queryItems = [];
  if (query.name) queryItems.push('name=\'' + query.name + '\'');
  if (query.parentId) queryItems.push('\'' + query.parentId + '\' in parents');
  if (query.trashed === false) queryItems.push('trashed=false');
  if (query.excludeName) queryItems.push('not name contains \'' + query.excludeName + '\'');
  if (query.onlyFolder) queryItems.push('mimeType=\'application/vnd.google-apps.folder\'');
  let request = gapi.client.drive.files.list({
    'pageSize': 10,
    'fields': "nextPageToken, files(id, name)",
    'q': queryItems.join(' and ')
  });
  request.then(res => {
    const files = res.result.files;
    if (files && files.length > 0) {
      console.log(files);
    } else {
      console.log('No files found with this query:', queryItems.join(' and '));
    }
  }, err => {
    console.error(err.body);
  });
  return request;
}


/**
 * Returns a promise with the contents of the file.
 * @param {String} fileId
 */
function getFileContent(fileId) {
  let request = gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media'
  });
  request.then(res => {
    console.log(res.body);
  }, err => {
    console.error(err.body);
  });
  return request;
}


function getFileData(fileId, fields) {
  let request = gapi.client.drive.files.get({
    fileId: fileId,
    fields: fields
  });
  request.then(res => {
    if (res.status === 200) {
      console.log('File data fetched succesfully.');
    }
  }, err => {
    console.error(err);
  });
  return request;
}


/**
 * Creates a new folder and returns its id
 * @param {String} title Folder name
 * @param {String} parentId Optional id of the parent folder, if none it will be created on the root
 */
function createFolder(title, parentId = 'drive') {
  const body = {
    "name": title,
    "mimeType": "application/vnd.google-apps.folder",
    "parents": parentId !== 'drive' ? [parentId] : [] // [parentId]
  }
  const request = gapi.client.request({
    'path': 'https://www.googleapis.com/drive/v3/files/',
    'method': 'POST',
    'body': body
  });
  request.then(res => { // for batch request
    console.log(title + ' folder created. Id: ' + JSON.parse(res.body).id);
  });
  return request;
}


/**
 * Uploads a file to the specified folder.
 * @param {String} fileContent The content as a string.
 * @param {String} fileMimeType The MIME Type of the file.
 * @param {String} fileName Name for the file.
 * @param {String} folderId Id of the parent folder.
 */
function uploadFile(fileContent, fileMimeType, fileName, folderId) {
  const file = new Blob([fileContent], { type: fileMimeType });
  const metadata = {
    'name': fileName, // Filename at Google Drive
    'mimeType': fileMimeType, // mimeType at Google Drive
    'parents': [folderId] // Folder ID at Google Drive
  };
  const accessToken = gapi.auth.getToken().access_token; // Here gapi is used for retrieving the access token.
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  let request = fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  });
  request.then(res => {
    if (res.ok === true && res.status === 200) {
      console.log('Upload of ' + fileName + ' successful.');
    }
  }, err => {
    console.error(err);
  });
  return request;
}




// Global object that will store all data
const appData = {
  appMainFolderId: undefined,
  projectsData: undefined,
  appSettingsFolderId: undefined,
  thumbsFolderId: undefined
}

/****** APP SPECIFIC FUNCTIONS ******/

const lastUploadedProject = {
  id: undefined,
  name: undefined,
  drawings: {},
  elementsData: {}
}

/*
It is very important to disable the button and show some progress until some feedback form GD is received, otherwise
the user could click several times on the button and at the end several identical projects would be created.
*/
async function createProject(file) {
  // Error message will be stored here if needed.
  let errorMsg;

  const fileContentRaw = await readInputFile(file);
  const fileContent = JSON.parse(fileContentRaw);
  console.log('File contents:', fileContent);
  // TODO: Check if the file is valid... structure? contents?...

  // The contents of the file if valid will be saved in the lastUploadedProject variable to be used in case the request
  // to Google Drive could not be completed. That way the user could work offline.
  lastUploadedProject.name = fileContent.projectInfo.title;
  lastUploadedProject.drawings = fileContent.drawings;
  lastUploadedProject.elementsData = fileContent.elementsData;

  // Check if the id of the appMainFolder is in the global data object
  // If not try to get it and if there is none one should be created
  if (!appData.appMainFolderId) {
    const appMainFolderRes = await listFiles({ name: 'VAviewerData', onlyFolder: true, trashed: false });
    const appMainFolderData = appMainFolderRes.result.files;
    if (appMainFolderData && appMainFolderData.length > 0) {
      appData.appMainFolderId = appMainFolderData[0].id;
    } else {
      // TODO This should return a promise to know if something went wrong
      appData.appMainFolderId = await createFolder('VAviewerData');
      console.log('No appFolder found, one is going to be created.');
    }
  }

  let projectFolderId;
  // Check if there is already a project with this name
  if (appData.projectsData === undefined || !appData.projectsData.find(proj => proj.name === fileContent.projectInfo.title)) {
    try {
      const folderCreationPromise = await createFolder(fileContent.projectInfo.title, appData.appMainFolderId);
      projectFolderId = JSON.parse(folderCreationPromise.body).id;
      lastUploadedProject.id = projectFolderId;
      const projectFolderData = { id: projectFolderId, name: fileContent.projectInfo.title };
      if (appData.projectsData === undefined) {
        appData.projectsData = [projectFolderData];
      } else if (!appData.projectsData.find(proj => proj.name === fileContent.projectInfo.title)) {
        appData.projectsData.push(projectFolderData);
      }
    } catch (err) {
      console.log(err);
      lastUploadedProject.id = 'temporal';
      errorMsg = JSON.parse(err.body).error.message;
    }
  } else if (appData.projectsData.find(proj => proj.name === fileContent.projectInfo.title)) { // Crear un archivo con todos lo nombres de proyectos en drive y pedirlo para comprovar
    // If there is one already something should be done, provide another name or cancel the operation
    errorMsg = 'No project was created because there is already a project with this name.';
  } else {
    console.error('Unknown error while attempting to create the project folder.');
  }


  // Create drawings subfolder only if there are drawings and projectFolderId was succesful
  if (projectFolderId && fileContent.drawings) {
    // Create drawgins subfolder
    const drawingsFolderPromise = await createFolder('drawings', projectFolderId);
    const drawingsFolderId = JSON.parse(drawingsFolderPromise.body).id;
    appData.projectsData[appData.projectsData.length - 1].drawingsFolderId = drawingsFolderId;
    // Upload drawings
    const drawingsPromises = [];
    for (const drawing in fileContent.drawings) {
      const drawingPromise = uploadFile(fileContent.drawings[drawing], 'image/svg+xml', drawing.concat('.svg'), drawingsFolderId);
      drawingsPromises.push(drawingPromise);
    }
    drawingsUploadsRes = await Promise.all(drawingsPromises)
      .then(responses => {
        // TODO: Is it necessary to check for each response in drawingsUploadsRes that it was (res.ok === true && res.status === 200) ??
        console.log('Drawings uploaded successfully.');
      }, err => {
        console.error(err);
      });
  }

  // Create elementsData subfolder only if there is data and projectFolderId was succesful
  if (projectFolderId && fileContent.elementsData) {
    // Create elementsData subfolder
    const elementsDataFolderPromise = await createFolder('elementsData', projectFolderId);
    const elementsDataFolderId = JSON.parse(elementsDataFolderPromise.body).id;
    appData.projectsData[appData.projectsData.length - 1].elementsDataFolderId = elementsDataFolderId;
    // Upload elements data files
    const elementsDataPromises = [];
    for (const elementData in fileContent.elementsData) {
      const elementDataPromise = uploadFile(JSON.stringify(fileContent.elementsData[elementData]), 'application/json', elementData.concat('.json'), elementsDataFolderId);
      elementsDataPromises.push(elementDataPromise);
    }
    elementsDataUploadRes = await Promise.all(elementsDataPromises)
      .then(responses => {
        // TODO: Is it necessary to check for each response in drawingsUploadsRes that it was (res.ok === true && res.status === 200) ??
        console.log('ElementsData files uploaded successfully.');
      }, err => {
        console.error(err);
      });
  }



  // TODO Should return something else indicating if the process has been successful or not
  // Si falla en vez de dejarlo a medias con lo que se ha creado habria que borrar lo que se ha creado
  if (projectFolderId) { // Improve the check
    console.log('Upload successful. Uploaded ' + Object.keys(fileContent.drawings).length + ' drawings.');
    return { id: projectFolderId, name: fileContent.projectInfo.title };
  } else {
    return Promise.reject(new Error('Project upload failed. ' + errorMsg));
    // Retry again or work offline with the uploaded project.
  }
}




async function listProjectItems() {
  // Gets the id of the app folder using its name
  const appMainFolderRes = await listFiles({ name: 'VAviewerData', onlyFolder: true, trashed: false });
  const appMainFolderData = appMainFolderRes.result.files;
  if (appMainFolderData && appMainFolderData.length > 0) {
    appData.appMainFolderId = appMainFolderData[0].id;
  } else {
    console.log('No appFolder found.');
  }
  // Gets the project folders names and ids
  const projectsFoldersRes = await listFiles({ parentId: appData.appMainFolderId, onlyFolder: true, excludeName: 'appSettings', trashed: false });
  appData.projectsData = projectsFoldersRes.result.files;
  console.assert(appData.projectsData.length > 0, 'There are no project folders.');
  // Gets the id of the appSettings folder
  const appSettFolderRes = await listFiles({ parentId: appData.appMainFolderId, name: 'appSettings', onlyFolder: true });
  const appSettFolderData = appSettFolderRes.result.files;
  if (appSettFolderData && appSettFolderData.length > 0) {
    appData.appSettingsFolderId = appSettFolderData[0].id;
  } else {
    console.log('No settings folder found.');
  }
  // Gets the id of the projectsThumbs folder
  const thumbsFolderRes = await listFiles({ parentId: appData.appSettingsFolderId, name: 'projectsThumbs', onlyFolder: true });
  const thumbsFolderData = thumbsFolderRes.result.files;
  if (thumbsFolderData && thumbsFolderData.length > 0) {
    appData.thumbsFolderId = thumbsFolderData[0].id;
  } else {
    console.log('No thumbs folder found.');
  }
  // Gets the data of each thumbnail and assign it to its corresponding project
  const imgRes = await listFiles({ parentId: appData.thumbsFolderId });
  const imgData = imgRes.result.files;
  appData.projectsData.forEach(proj => {
    const projectThumbData = imgData.find(img => proj.id === img.name.replace('.jpg', ''));
    if (projectThumbData) {
      proj.thumbId = projectThumbData.id;
    }
  });
  console.assert(imgData.length > 0, 'There are no thumbnails.');


  // TODO Deberia devolver una promesa y ponerlos fuera, ademas seria mas facil para quitar el loading

  // Create the project items
  appData.projectsData.forEach(proj => {
    const projectItem = createProjectItem(proj);
    projectsContainer.appendChild(projectItem);
  });

  // Adjust the items
  calcRemainig();

  manageLoadingMsg(false);
}

function createProjectItem(projData) {
  const projItem = document.createElement('button');
  if (projData.id === 'temporal') { // Only for uploaded that have failed to store in back
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

// Adds a new item to the list
function updateProjectsList(projData) {
  const projectItem = createProjectItem(projData);
  projectsContainer.prepend(projectItem);
  calcRemainig();
}

const projListContainer = document.getElementById('projectsList');
const projectsContainer = document.getElementById('projects');

let previousActiveItem;

projectsContainer.addEventListener('click', e => {
  const projectItem = e.target.closest('[data-proj-id]');
  if (projectItem.dataset.projId === currentProject.id) {
    // Cerrar la lista de proyectos ?
    return;
  }
  // TODO si se esta trabajando en un proyecto preguntar si se quiere guardar antes de que se cierre
  // si era un proyecto offline no syncronizado, lo cual se ve por su id 'temporal' provar a sincronizar de nuevo, sus contenidos estaran en current proj
  if (projectItem.dataset.projId === lastUploadedProject.id) {
    if (lastUploadedProject.id === 'temporal') {
      console.log('Show a message indicating that the project can be accessed but in viewer mode because it couldnt be saved, accept to proceed.');
    }
    goToProject(lastUploadedProject);
    if (previousActiveItem) {
      previousActiveItem.classList.remove('current');
    }
    projectItem.classList.add('current');
    previousActiveItem = projectItem;
  } else {
    manageLoadingMsg(true, `Loading project ${projectItem.dataset.name}`);
    fetchProject(projectItem.dataset.projId)
      .then(res => {
        console.log(res);
        // Fetch successfull of the settings file, the ids of drawings and elementsData of the project
        goToProject(res); // res --> {id: '', name: '', drawings: {'name': {'id'}, 'name': {'id'}}}
        if (previousActiveItem) {
          previousActiveItem.classList.remove('current');
        }
        projectItem.classList.add('current');
        previousActiveItem = projectItem;
        console.log('a');
        projectsListBtn.style.display = 'unset';
        manageLoadingMsg(false);
      }, err => {
        console.log(err);
        // if (err.id === 'temporal') {
        //   // Fetch unsuccessfull still should be able to work if the requested project is the lastUploadedProject
        //   goToProject(lastUploadedProject);
        // }
      });
  }
});

function goToProject(project) {
  createWorkspace(project);
  projListContainer.style.display = 'none';

  history.replaceState({ projectTitle: project.name }, project.name, "?id=" + project.id); // encodeURIComponent
}


// Fetches the project contents. It only fetches the resources that are not already in the appData object.
// It only checks that the category of data exists to avoid fetching. It doesn't check each resource individually.
async function fetchProject(projectId) {
  let projectIndex;
  // In case the projectsData entry is still empty this will be the first project 
  // This will happen when someone access a project directly ?
  if (appData.projectsData === undefined) {
    const projectNameRes = await getFileData(projectId, 'name, trashed');
    console.log('b');
    if (!JSON.parse(projectNameRes.body).trashed) {
      appData.projectsData = [{ id: projectId, name: JSON.parse(projectNameRes.body).name }];
      projectIndex = 0;
      console.log('c');
    }
  } else if (projectId !== 'temporal') {
    projectIndex = appData.projectsData.findIndex(proj => proj.id === projectId);
  }

  // TODO Hay que comprovar que realmente exista un proyecto con ese id en drive...
  console.log('Loading project: ' + projectId);

  // If there is no data for projectSettings.json file fetch its contents.
  if (projectIndex >= 0 && !appData.projectsData[projectIndex].projSettings) {
    const projSettingsRes = await listFiles({ parentId: projectId, name: 'projectSettings.json' }); // Si esta offline aqui salta error
    const projSettingsData = projSettingsRes.result.files;
    if (projSettingsData && projSettingsData.length > 0) {
      // Get the content projectSettings.json file:
      const projSettingsContentRes = await getFileContent(projSettingsData[0].id);
      appData.projectsData[projectIndex].projSettings = projSettingsContentRes.body;
    } else {
      console.log('No projectSettings.json found.');
    }
  }

  // If there is no data for drawings already then fetch the id of the drawings folder and the data of each one.
  if (projectIndex >= 0 && !appData.projectsData[projectIndex].drawings) {
    const drawingsFolderRes = await listFiles({ parentId: projectId, onlyFolder: true, name: 'drawings' });
    const drawingsFolderData = drawingsFolderRes.result.files;
    if (drawingsFolderData && drawingsFolderData.length > 0) {
      const drawingsRes = await listFiles({ parentId: drawingsFolderData[0].id });
      appData.projectsData[projectIndex].drawings = {};
      // With this structure there cannot be two drawings with the same name
      drawingsRes.result.files.forEach(drawing => {
        appData.projectsData[projectIndex].drawings[drawing.name.replace(/.svg$/, '')] = { id: drawing.id }
      });
    } else {
      console.log('No drawings folder found.');
    }
  }

  // If there is no data for elements already then fetch the id of the elementsData folder and the data of each one.
  if (projectIndex >= 0 && !appData.projectsData[projectIndex].elementsData) {
    const elementsDataFolderRes = await listFiles({ parentId: projectId, onlyFolder: true, name: 'elementsData' });
    const elementsDataFolderData = elementsDataFolderRes.result.files;
    if (elementsDataFolderData && elementsDataFolderData.length > 0) {
      const elementsDataRes = await listFiles({ parentId: elementsDataFolderData[0].id });
      appData.projectsData[projectIndex].elementsData = elementsDataRes.result.files;
    } else {
      console.log('No elementsData folder found.');
    }
  }

  // If there is no data for images already then fetch the id of the images folder and the data of each one
  if (projectIndex >= 0 && !appData.projectsData[projectIndex].images) {
    const imagesFolderRes = await listFiles({ parentId: projectId, onlyFolder: true, name: 'images' });
    const imagesFolderData = imagesFolderRes.result.files;
    if (imagesFolderData && imagesFolderData.length > 0) {
      const imagesRes = await listFiles({ parentId: imagesFolderData[0].id });
      appData.projectsData[projectIndex].images = imagesRes.result.files;
    } else {
      console.log('No images folder found.');
    }
  }

  if (projectIndex >= 0) {
    console.log('Project resources fetched succesfully.');
    return appData.projectsData[projectIndex];
  } else {
    return Promise.reject(new Error('Project resources could not be fetched.')); // { message: new Error('Project resources could not be fetched.'), id: projectId }
  }
}