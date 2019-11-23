import Generics from './generics';

export default class {

  /****** BASIC GOOGLE API FUNCTIONS ******/

  /**
   * Retrieves id and name of the files that match the query object.
   * @param {Object} query Object with optional entries: name (str), parentId (str), trashed (bool), excludeName (str), and onlyFolder (bool)
   */
  static listFiles(query) {
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
  static getFileContent(fileId) {
    let request = gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });
    request.then(res => {
      if (res.status === 200)
        console.log('File fetched successfully.');
    }, err => {
      console.error(err.body);
    });
    return request;
  }


  /**
   * Returns a promise with the requested data of the file.
   * @param {String} fileId The id of the file to get the data of.
   * @param {String} fields The data to be fetched in format: 'field1, field2'.
   */
  static getFileData(fileId, fields) {
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
   * Creates a new folder and returns its id.
   * @param {String} title The name of the folder.
   * @param {String} parentId Optional id of the parent folder, if none it will be created on the root.
   */
  static createFolder(title, parentId = 'drive') {
    const body = {
      "name": title,
      "mimeType": "application/vnd.google-apps.folder",
      "parents": parentId !== 'drive' ? [parentId] : []
    }
    const request = gapi.client.request({
      'path': 'https://www.googleapis.com/drive/v3/files/',
      'method': 'POST',
      'body': body
    });
    request.then(res => {
      console.log(title + ' folder created. Id: ' + JSON.parse(res.body).id);
    });
    return request;
  }


  /**
   * Upload a file to the specific folder.
   * @param {String} fileContent The content of the file as a string.
   * @param {String} fileMimeType The MIME Type of the file. For example: 'application/json'
   * @param {String} fileName Name for the file.
   * @param {String} folderId Id of the parent folder.
   */
  static uploadFile(fileContent, fileMimeType, fileName, folderId) {
    const file = new Blob([fileContent], { type: fileMimeType });
    const metadata = {
      'name': fileName,
      'mimeType': fileMimeType,
      'parents': [folderId]
    };
    const accessToken = gapi.auth.getToken().access_token; // Gapi is used for retrieving the access token.
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


  /**
   * Update the contents of a file.
   * @param {String} fileContent The content of the file as a string.
   * @param {String} fileMimeType The MIME Type of the file. For example: 'application/json'.
   * @param {String} fileId ID of the file to update its content.
   */
  static updateFileContent(fileContent, fileMimeType, fileId) {
    const file = new Blob([fileContent], { type: fileMimeType });
    const metadata = {
      'mimeType': fileMimeType
    };
    const accessToken = gapi.auth.getToken().access_token; // Gapi is used for retrieving the access token.
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    let request = fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, { // Otherwise try uploadType=media
      method: 'PATCH',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form,
    });
    request.then(res => {
      if (res.ok === true && res.status === 200) {
        console.log('Update successful.');
      }
    }, err => {
      console.error(err);
    });
    return request;
  }


  /**
   * Rename a file.
   * @param {String} fileId ID of the file to rename.
   * @param {String} newTitle New title for the file.
   */
  static renameFile(fileId, newTitle) {
    var request = gapi.client.drive.files.update({
      'fileId': fileId,
      'name': newTitle,
      'uploadType': 'media'
    });
    request.then(res => {
      console.log(res);
    }, rej => {
      console.log(rej);
    });
  }


  /**
   * Permanently delete a file, skipping the trash.
   * @param {String} fileId ID of the file to delete.
   */
  static deleteFile(fileId) {
    let request = gapi.client.drive.files.delete({
      'fileId': fileId
    });
    request.then(res => {
      console.log(res);
    }, rej => {
      console.log(rej);
    });
    return request;
  }


  /*******************************************************************/
  /***************** APPLICATION SPECIFIC FUNCTIONS ******************/
  /*******************************************************************/

  /**
   * Creates a new project folder and a subtructure with all the contents of the project on the file.
   * @param {JSON} file The VisualARQ Drawings file created by the exporter.
   * @param {Object} AppData The AppData object that contains info about the app resources.
   * @param {Object} lastUploadedProject Object with the contents of the last uploaded project.
   */
  static async createProject(file, AppData, lastUploadedProject) {
    // Error message will be stored here if needed.
    let errorMsg;

    const fileContentRaw = await Generics.readInputFile(file);
    const fileContent = JSON.parse(fileContentRaw);
    console.log('File contents:', fileContent);
    // TODO: Check if the file is valid... minimum required fields? contents?...

    // The contents of the file if valid will be saved in the lastUploadedProject variable to be used
    // without the need to fetch them. This allows to view the project even without internet connexion.
    lastUploadedProject.name = fileContent.projectInfo.title;
    lastUploadedProject.drawings = fileContent.drawings;
    lastUploadedProject.elementsData = fileContent.elementsData;

    // Check if the id of the appMainFolder is in the appData global object.
    // If there is none then try to get it, and if there is none one should be created.
    if (!AppData.appMainFolderId) {
      const appMainFolderRes = await this.listFiles({ name: 'VAviewerData', onlyFolder: true, trashed: false });
      const appMainFolderData = appMainFolderRes.result.files;
      if (appMainFolderData && appMainFolderData.length > 0) {
        AppData.appMainFolderId = appMainFolderData[0].id;
      } else {
        // TODO: This should return a promise to know if something went wrong.
        const appMainFolderRes = await this.createFolder('VAviewerData');
        AppData.appMainFolderId = JSON.parse(appMainFolderRes.body).id;
        console.log('No appFolder found, one is going to be created.');
      }
    }

    let projectFolderId;

    // Check if there is already a project with this name in the appData object.
    if (AppData.projectsData === undefined || !AppData.projectsData.find(proj => proj.name === fileContent.projectInfo.title)) {
      try {
        const folderCreationPromise = await this.createFolder(fileContent.projectInfo.title, AppData.appMainFolderId);
        projectFolderId = JSON.parse(folderCreationPromise.body).id;
        lastUploadedProject.id = projectFolderId;
        const projectFolderData = { id: projectFolderId, name: fileContent.projectInfo.title };
        if (AppData.projectsData === undefined) {
          AppData.projectsData = [projectFolderData];
        } else if (!AppData.projectsData.find(proj => proj.name === fileContent.projectInfo.title)) {
          AppData.projectsData.push(projectFolderData);
        }
      } catch (err) {
        console.log(err);
        lastUploadedProject.id = 'temporal';
        errorMsg = JSON.parse(err.body).error.message;
      }
    } else if (AppData.projectsData.find(proj => proj.name === fileContent.projectInfo.title)) {
      // TODO: In case not all projects are loaded how to check if there is already one with this name in the backend?
      // TODO: If there is one already, provide an option to propose another name.
      errorMsg = 'No project was created because there is already a project with this name.';
    } else {
      console.error('Unknown error while attempting to create the project folder.');
    }

    // Create the drawings subfolder only if there are drawings and if the project folder was created succesfully.
    if (projectFolderId && fileContent.drawings) {
      const drawingsFolderPromise = await this.createFolder('drawings', projectFolderId);
      const drawingsFolderId = JSON.parse(drawingsFolderPromise.body).id;
      AppData.projectsData[AppData.projectsData.length - 1].drawingsFolderId = drawingsFolderId;
      // Upload the drawings.
      const drawingsPromises = [];
      for (const drawing in fileContent.drawings) {
        const drawingPromise = this.uploadFile(fileContent.drawings[drawing], 'image/svg+xml', drawing.concat('.svg'), drawingsFolderId);
        drawingsPromises.push(drawingPromise);
      }
      await Promise.all(drawingsPromises)
        .then(res => {
          // TODO: Is it necessary to check if each response was (res.ok === true && res.status === 200)?
          console.log('Drawings uploaded successfully.');
        }, err => {
          console.error(err);
        });
    }

    // Create the elementsData subfolder only if there is data and if the project folder was created succesfully.
    if (projectFolderId && fileContent.elementsData) {
      const elementsDataFolderPromise = await this.createFolder('elementsData', projectFolderId);
      const elementsDataFolderId = JSON.parse(elementsDataFolderPromise.body).id;
      AppData.projectsData[AppData.projectsData.length - 1].elementsDataFolderId = elementsDataFolderId;
      // Upload the elements data files.
      const elementsDataPromises = [];
      for (const elementData in fileContent.elementsData) {
        const elementDataPromise = this.uploadFile(JSON.stringify(fileContent.elementsData[elementData]), 'application/json', elementData.concat('.json'), elementsDataFolderId);
        elementsDataPromises.push(elementDataPromise);
      }
      await Promise.all(elementsDataPromises)
        .then(res => {
          // TODO: Is it necessary to check if each response was (res.ok === true && res.status === 200)?
          console.log('ElementsData files uploaded successfully.');
        }, err => {
          console.error(err);
        });
    }

    // TODO: Check in more detail if the project was created successfully.
    if (projectFolderId) {
      console.log('Upload successful. Uploaded ' + Object.keys(fileContent.drawings).length + ' drawings.');
      return { id: projectFolderId, name: fileContent.projectInfo.title };
    } else {
      // TODO: If the project upload fails the project folder, if created, should be deleted.
      // TODO: Create message with content: Retry again or work offline with the uploaded project.
      return Promise.reject(new Error('Project upload failed. ' + errorMsg));
    }
  }


  /**
   * Lists the project items.
   * TODO: Limit the amount of projects to fetch.
   * @param {Object} AppData The AppData object that contains info about the app resources.
   */
  static async listProjectItems(AppData) {
    // Gets the id of the app folder using its name if it was not already in the appData object.
    if (!AppData.appMainFolderId) {
      const appMainFolderRes = await this.listFiles({ name: 'VAviewerData', onlyFolder: true, trashed: false });
      const appMainFolderData = appMainFolderRes.result.files;
      if (appMainFolderData && appMainFolderData.length > 0) {
        AppData.appMainFolderId = appMainFolderData[0].id;
      } else {
        console.log('No appFolder found.');
        return Promise.reject(new Error('No appFolder found.'));
      }
    }

    // Gets the project folders names and ids.
    const projectsFoldersRes = await this.listFiles({ parentId: AppData.appMainFolderId, onlyFolder: true, excludeName: 'appSettings', trashed: false });
    let newProjects;
    const projectsFoldersData = projectsFoldersRes.result.files;
    if (projectsFoldersData && projectsFoldersData.length > 0) {
      if (AppData.projectsData === undefined) {
        newProjects = projectsFoldersData;
        AppData.projectsData = newProjects;
      } else if (Array.isArray(AppData.projectsData)) {
        newProjects = projectsFoldersRes.result.files.filter(newProj => AppData.projectsData.find(proj => proj.id === newProj.id) === undefined);
        newProjects.forEach(proj => {
          AppData.projectsData.push(proj);
        });
      }
    }
    console.assert(AppData.projectsData.length > 0, 'There are no project folders.');

    // Gets the id of the appSettings folder.
    const appSettFolderRes = await this.listFiles({ parentId: AppData.appMainFolderId, name: 'appSettings', onlyFolder: true });
    const appSettFolderData = appSettFolderRes.result.files;
    if (appSettFolderData && appSettFolderData.length > 0) {
      AppData.appSettingsFolderId = appSettFolderData[0].id;
    } else {
      console.log('No settings folder found.');
    }

    // Gets the id of the projectsThumbs folder.
    const thumbsFolderRes = await this.listFiles({ parentId: AppData.appSettingsFolderId, name: 'projectsThumbs', onlyFolder: true });
    const thumbsFolderData = thumbsFolderRes.result.files;
    if (thumbsFolderData && thumbsFolderData.length > 0) {
      AppData.thumbsFolderId = thumbsFolderData[0].id;
    } else {
      console.log('No thumbs folder found.');
    }

    // Gets the data of each thumbnail and assign it to its corresponding project.
    const imgRes = await this.listFiles({ parentId: AppData.thumbsFolderId });
    const imgData = imgRes.result.files;
    AppData.projectsData.forEach(proj => {
      const projectThumbData = imgData.find(img => proj.id === img.name.replace('.jpg', ''));
      if (projectThumbData) {
        proj.thumbId = projectThumbData.id;
      }
    });
    console.assert(imgData.length > 0, 'There are no thumbnails.');

    // TODO: Missing the management of an error while listing the projects.

    // If all the required data about the projects was fetched successfully it is returned.
    return newProjects;
  }


  /**
   * Fetches the project contents. Specifically the id and the name of all the drawings and elementsData files.
   * It only fetches the resources that are not already in the appData object.
   * TODO: Improve the detection of resources that should be fetched. Currently if there is already any project
   * data for that category (e.g: drawings) in the front it doenst fetch any new file of that category.
   * @param {String} projectId The id of the project.
   * @param {Object} AppData The AppData object that contains info about the app resources.
   */
  static async fetchProject(projectId, AppData) {
    console.log('Fetching project: ' + projectId);

    let projectIndex;
    // In case the projectsData entry is still undefined this will be the first project to be fetched.
    // This will happen when someone access a project directly with its id in the url.
    if (AppData.projectsData === undefined) {
      const projectNameRes = await this.getFileData(projectId, 'name, trashed');
      if (!JSON.parse(projectNameRes.body).trashed) {
        AppData.projectsData = [{ id: projectId, name: JSON.parse(projectNameRes.body).name }];
        projectIndex = 0;
      }
    } else if (projectId !== 'temporal') {
      projectIndex = AppData.projectsData.findIndex(proj => proj.id === projectId);
    }

    // If there is no data for projectSettings.json file in the appData yet fetch it.
    if (projectIndex >= 0 && !AppData.projectsData[projectIndex].projSettings) {
      const projSettingsRes = await this.listFiles({ parentId: projectId, name: 'projectSettings.json' });
      const projSettingsData = projSettingsRes.result.files;
      if (projSettingsData && projSettingsData.length > 0) {
        const projSettingsContentRes = await this.getFileContent(projSettingsData[0].id);
        AppData.projectsData[projectIndex].projSettings = projSettingsContentRes.body;
      } else {
        console.log('No projectSettings.json found.');
      }
    }

    // If there is no data for drawings already fetch the id of the drawings folder and the name and id of each one.
    if (projectIndex >= 0 && !AppData.projectsData[projectIndex].drawings) {
      const drawingsFolderRes = await this.listFiles({ parentId: projectId, onlyFolder: true, name: 'drawings' });
      const drawingsFolderData = drawingsFolderRes.result.files;
      if (drawingsFolderData && drawingsFolderData.length > 0) {
        const drawingsRes = await this.listFiles({ parentId: drawingsFolderData[0].id });
        AppData.projectsData[projectIndex].drawings = {};
        // With this structure there cannot be two drawings with the same name.
        drawingsRes.result.files.forEach(drawing => {
          AppData.projectsData[projectIndex].drawings[drawing.name.replace(/.svg$/, '')] = { id: drawing.id }
        });
      } else {
        console.log('No drawings folder found.');
      }
    }

    // If there is no data for elementsData already fetch the id of the elementsData folder and the name and id of each one.
    if (projectIndex >= 0 && !AppData.projectsData[projectIndex].elementsData) {
      const elementsDataFolderRes = await this.listFiles({ parentId: projectId, onlyFolder: true, name: 'elementsData' });
      const elementsDataFolderData = elementsDataFolderRes.result.files;
      if (elementsDataFolderData && elementsDataFolderData.length > 0) {
        const elementsDataRes = await this.listFiles({ parentId: elementsDataFolderData[0].id });
        AppData.projectsData[projectIndex].elementsData = elementsDataRes.result.files;
      } else {
        console.log('No elementsData folder found.');
      }
    }

    // If there is no data for images already fetch the id of the images folder and the name and id of each one.
    if (projectIndex >= 0 && !AppData.projectsData[projectIndex].images) {
      const imagesFolderRes = await this.listFiles({ parentId: projectId, onlyFolder: true, name: 'images' });
      const imagesFolderData = imagesFolderRes.result.files;
      if (imagesFolderData && imagesFolderData.length > 0) {
        const imagesRes = await this.listFiles({ parentId: imagesFolderData[0].id });
        AppData.projectsData[projectIndex].images = imagesRes.result.files;
      } else {
        console.log('No images folder found.');
      }
    }

    if (projectIndex >= 0) {
      console.log('Project resources fetched succesfully.');
      return AppData.projectsData[projectIndex];
    } else {
      return Promise.reject(new Error('Project resources could not be fetched.'));
    }
  }

}