/**
 * Print files.
 */
function listFiles() {
  gapi.client.drive.files.list({
    'pageSize': 10,
    'fields': "nextPageToken, files(id, name)",
    'q': 'trashed=false' // Avoid files in trsh
  }).then(res => {
    appendPre('Files:');
    const files = res.result.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        appendPre(file.name + ' (' + file.id + ')');
      }
    } else {
      appendPre('No files found.');
    }
  });
}


function readFileContent(fileId) {
  let request = gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media'
  })
  request.then(res => {
    console.log(res.body);
    appendSVG(res.body);
  }, err => {
    console.error(err.body);
  })
  return request; // for batch request
}

function getFileLink(fileId) {
  gapi.client.drive.files.get({
    fileId: fileId,
    fields: 'webContentLink'
  }).then(res => {
    // To remove the 'download' at the end of the link: linkstr.replace('&export=download', '');
    const fileUrl = JSON.parse(res.body).webContentLink;
    createImg(fileUrl);
    console.log(fileUrl);
  }, err => {
    console.error(err);
  });
}

//Creates a new project folder in the app folder and returns the ID
function createFolder(title, parentId) {
  const body = {
    "name": title,
    "mimeType": "application/vnd.google-apps.folder",
    "parents": [parentId]
  }
  const request = gapi.client.request({
    'path': 'https://www.googleapis.com/drive/v3/files/',
    'method': 'POST',
    'body': body
  });
  return request.then(res => { // for batch request
    console.log('Folder ID', JSON.parse(res.body).id);
    return JSON.parse(res.body).id;
  });
}

/*
It is very important to disable the button and show some progress until some feedback form GD is received, otherwise
the user could click several time on the button and at the end several identical projects would be created
*/
async function createProject(file) {
  const fileContent = await readInputFile(file);
  // Create project folder
  const mainFolderId = await createFolder('lastProj', '1OHi3ynQoner7IPvmKhuraVNuD6zGLL12');
  // Create sub folder
  const subFolderId = await createFolder('jsonData', mainFolderId);
  // Place file in subfolder
  uploadFile(fileContent, file.type, file.name, subFolderId);
}

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

  fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  }).then((res) => {
    return res.json();
  }).then(function (val) {
    console.log(val);
  });
}