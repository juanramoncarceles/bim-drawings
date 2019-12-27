import API from './api';
import { Workspace } from './workspace';
import { ProjectData } from './projectData';
import Generics from './generics';
import { AddComment } from './appTools/addComment';
import { ElementData } from './appTools/elementData';
import { ShareProject } from './shareProject';
import { NotificationsManager } from './notificationsManager';

export class Application {
  constructor() {
    this.appMainFolderId = undefined;
    // projectsData: Array of objects with data like 'name' and 'id' of the projects.
    this.projectsData = undefined;
    this.appSettingsFolderId = undefined;
    this.thumbsFolderId = undefined;
    // If a user is logged it profile info is stored here.
    this.userInfo = undefined;
    this.userInfoContainer = document.getElementById('user-info');
    // The current workspace object will be referenced here.
    this.workspace = undefined;
    this.lastUploadedProject = new ProjectData();
    // Stores the active item in the projects list.
    this.previousActiveItem;
    this.projectsListBtn = document.getElementById('projectsListBtn');
    this.drawingsContainer = document.getElementById('drawingsContainer');
    this.drawingsBtns = document.getElementById('drawingsBtns');
    this.toolbarsContainer = document.getElementById('toolbarsContainer');
    // Modal dialog.
    this.modalDialogContainer = document.getElementById('modalDialogContainer');
    this.modalDialogContent = this.modalDialogContainer.querySelector('.modal-content');
    this.modalDialogsStorage = document.getElementById('modalDialogsStorage');
    this.closeModalBtn = document.getElementById('closeModalBtn');
    this.closeModalDialog = this.closeModalDialog.bind(this);
    this.closeModalBtn.onclick = this.closeModalDialog;
    // Viewport message.
    this.viewportMessage = document.getElementById('viewportMessage');
    // Projects list.
    this.projectsListContainer = document.getElementById('projectsListContainer');
    this.projectsList = document.getElementById('projectsList');
    this.closeProjectsListBtn = document.getElementById('closeProjectsListBtn');
    // Main panel.
    this.mainPanel = document.getElementById('mainPanel');
    this.panelsStorage = document.getElementById('panelsStorage');
    this.saveBtn = document.getElementById('saveBtn');
    this.saveCommentsData = this.saveCommentsData.bind(this);
    this.saveBtn.addEventListener('click', this.saveCommentsData);
    this.closeProjectsList = this.closeProjectsList.bind(this);
    this.projectsListBtn.onclick = () => {
      if (this.projectsListBtn.dataset.open === 'true') {
        this.closeProjectsList();
      } else if (this.projectsListBtn.dataset.open === 'false') {
        this.openProjectsList();
      }
    }
    this.closeProjectsListBtn.addEventListener('click', this.closeProjectsList);
    this.goToProject = this.goToProject.bind(this);
    this.projectsList.addEventListener('click', this.goToProject);
    /********************* Upload project form *********************/
    this.uploadFileForm = document.getElementById('uploadFileForm');
    this.fileInput = document.getElementById('fileInput');
    this.submitFileBtn = this.uploadFileForm.querySelector('button[type="submit"]');
    // Show the upload project form.
    document.getElementById('newProjectBtn').addEventListener('click', () => {
      this.showModalDialog(this.uploadFileForm);
      this.modalDialogContainer.classList.add('grayTranslucent');
    });
    // Hide the upload project form.
    document.getElementById('closeUploadForm').addEventListener('click', () => {
      this.closeModalDialog(this.uploadFileForm);
      this.modalDialogContainer.classList.remove('grayTranslucent');
    });
    // Listen to file input changes.
    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files.length > 0) {
        this.fileInput.nextElementSibling.innerHTML = this.fileInput.files[0].name;
        this.submitFileBtn.classList.remove('disabled');
      } else {
        this.fileInput.nextElementSibling.innerHTML = 'Choose a file';
        this.submitFileBtn.classList.add('disabled');
      }
    });
    // Submit file logic.
    this.uploadFileForm.onsubmit = e => {
      e.preventDefault();
      // Set loading state on UI.
      document.getElementById('loadingFile').style.display = 'unset';
      this.submitFileBtn.classList.add('disabled');
      this.submitFileBtn.innerHTML = 'Uploading file';
      this.fileInput.nextElementSibling.style.display = 'none';
      const file = e.target.elements["file"].files[0];
      // TODO: Show some real progress while creating the project.
      API.createProject(file, this, this.lastUploadedProject).then(res => {
        this.updateProjectsList(res);
        this.closeModalDialog(this.uploadFileForm);
        this.showMessage('success', 'Project uploaded successfully.');
        this.fileInput.value = '';
        // Reset upload form UI.
        document.getElementById('loadingFile').style.display = 'none';
        this.fileInput.nextElementSibling.innerHTML = 'Choose a file';
        this.submitFileBtn.innerHTML = 'Upload';
        this.fileInput.nextElementSibling.style.display = 'unset';
      }, err => {
        this.closeModalDialog(this.uploadFileForm);
        this.updateProjectsList(this.lastUploadedProject);
        console.error(err);
      });
    }
    /********************* Share project form *********************/
    this.shareProjectDialog = new ShareProject(document.getElementById('shareProjectDialog'), this);
    /********************** Message container **********************/
    this.messageContainer = document.getElementById('messageContainer');
    this.closeMessage = this.closeMessage.bind(this);
    this.messageContainer.querySelector('button').onclick = this.closeMessage;
    this.messageTimerId;
    /*************** Projects list items distribution **************/
    window.onresize = this.adjustItems;
    /**************** Tools buttons event listeners ****************/
    // TODO: This would make more sense as part of the workspace ?
    document.getElementById('tool-4').addEventListener('click', (e) => this.workspace.manageTools(e, ElementData, 'elementsDataTool'));
    document.getElementById('tool-5').addEventListener('click', (e) => this.workspace.manageTools(e, AddComment, 'commentsTool'));

    this.notificationsManager = new NotificationsManager();

    // TESTS. TO DELETE
    document.getElementById('viewDeviceToken').onclick = () => getMessagingToken();
    document.getElementById('saveDeviceToken').onclick = () => saveMessagingDeviceToken();
    document.getElementById('sendEmail').onclick = () => API.sendSharingProjectEmail('Pepi', 'juanramoncarceles@gmail.com', 'Casa', '94w02u');

    document.getElementById('createNotification').onclick = () => this.notificationsManager.createNotificaction({ author: 'Jaime', projectName: 'Test Hotel', content: 'Take a look at this.', thumb: 'src/assets/avatar-placeholder.png', projectId: 'j424r4349roi4oe' });
    // this.sendNotification = document.getElementById('sendNotification');
    // this.sendNotification.onclick = () => {
    //   // What ?
    // }
  }


  /**
   * Stores the current logged user info as a property of the app and
   * populates the UI with the user info.
   */
  async setUserInfo() {
    const userInfoRes = await API.getUserInfo();
    // An object with at least displayName, photoLink and emailAddress.
    const user = JSON.parse(userInfoRes.body).user;
    this.userInfo = user;
    this.userInfoContainer.innerHTML = `
      <img src=${this.userInfo.photoLink}>
      <span>
        <span>${this.userInfo.displayName}</span><span class="email">${this.userInfo.emailAddress}</span>
      </span>`;
  }


  /**
   * Saves the comments data created using the comments array from the current workspace.
   * It creates the file if it still doesnt exist or updates its contents if it exists.
   */
  async saveCommentsData() {
    if (this.workspace && this.workspace.commentsChangesUnsaved) {
      // TODO: Show viewport waiting message.
      let savingSuccessful;
      // Collect the data to save in backend.
      const dataToSave = [];
      this.workspace.comments.forEach(comment => {
        dataToSave.push({
          elementId: comment.elementId,
          content: comment.content
        });
      });
      const jsonDataToSave = JSON.stringify(dataToSave);
      // If there is id for the comments.json file.
      if (!this.workspace.commentsFileId) {
        // Create the file with the contents and get the id of it.
        // TODO: The current uploadFile doesnt return the id of the created file.
        // This makes it longer with a second request to get the id of it.
        // There is no example on the Google Drive API documentation for browser.
        const commentsFileCreationRes = await API.uploadFile(jsonDataToSave, 'application/json', 'comments.json', this.workspace.projectId);
        if (commentsFileCreationRes.ok && commentsFileCreationRes.status === 200) {
          const commentsFileRes = await API.listFiles({ name: 'comments.json', parentId: this.workspace.projectId, trashed: false });
          const commentsFileData = commentsFileRes.result.files;
          if (commentsFileData && commentsFileData.length === 1) {
            this.workspace.commentsFileId = commentsFileData[0].id;
            savingSuccessful = true;
            console.log('comments.json created: ' + this.workspace.commentsFileId);
          } else {
            savingSuccessful = false;
            // TODO: Delete existing created file/s with name 'comments.json', if there is no id then use the name.
          }
        }
      } else {
        // Update the existing comments.json file.
        const commentsFileUpdateRes = await API.updateFileContent(jsonDataToSave, 'application/json', this.workspace.commentsFileId);
        if (commentsFileUpdateRes.ok && commentsFileUpdateRes.status === 200) {
          savingSuccessful = true;
        }
      }
      // TODO: Remove viewport waiting message.
      if (savingSuccessful) {
        // TODO: Show message indicating success.
        this.commentsChangesUnsaved = false;
        this.saveBtn.classList.remove('enabled');
        this.saveBtn.classList.add('disabled');
        console.log('Data saved successfully.');
      } else {
        // TODO: message something went wrong.
        console.log('Something went wrong trying to save. Retry again.');
      }
    }
  }


  /************************ THE PROJECTS LIST ************************/

  /**
   * Selects a project from the list and manages its resources before opening the project.
   * @param {Event} e Click event.
   */
  goToProject(e) {
    const projectItem = e.target.closest('[data-proj-id]');
    if (projectItem === null) {
      return;
    }
    // If it is the current project close the list window.
    if (this.workspace && this.workspace.projectId === projectItem.dataset.projId) {
      return;
    }
    // TODO: If there have been changes in the project ask to save or discard them before closing it.
    // TODO: If it was an offline project try to sync it before closing it. The id would be 'temporal' and the contents in currentProject
    if (projectItem.dataset.projId === this.lastUploadedProject.id) {
      if (this.lastUploadedProject.id === 'temporal') {
        console.log('Show a message indicating that the project can be accessed but in viewer mode because it couldnt be saved.');
      }
      this.openProject(this.lastUploadedProject);
      if (this.previousActiveItem) {
        this.previousActiveItem.classList.remove('current');
      }
      projectItem.classList.add('current');
      this.previousActiveItem = projectItem;
      this.projectsListBtn.style.display = 'unset';
    } else {
      this.showViewportDialog('loader', `Loading project ${projectItem.dataset.name}`);
      API.fetchProject(projectItem.dataset.projId, this)
        .then(res => {
          this.openProject(res);
          if (this.previousActiveItem) {
            this.previousActiveItem.classList.remove('current');
          }
          projectItem.classList.add('current');
          this.previousActiveItem = projectItem;
          this.projectsListBtn.style.display = 'unset';
          this.hideViewportMessage();
        }, err => {
          console.log(err);
        });
    }
  }

  /**
   * Creates a workspace with the provided project.
   * @param {Object} project Data of the project: id, name, drawings ids and elementsData files ids.
   */
  openProject(project) {
    if (this.workspace) {
      this.workspace.close();
    }
    this.workspace = new Workspace(project, this);
    this.projectsListContainer.style.display = 'none';
    history.replaceState({ projectTitle: project.name }, project.name, "?id=" + project.id); // encodeURIComponent ? use pushState() ?
  }

  /**
   * Closes the projects list and shows the current project toolbar.
   * Sets the state of the ui as projects list closed.
   */
  closeProjectsList() {
    this.projectsListContainer.style.display = 'none';
    this.drawingsBtns.style.display = 'unset';
    this.toolbarsContainer.style.display = 'flex';
    this.projectsListBtn.dataset.open = 'false';
  }

  /**
   * Opens the list of projects container and fetches projects if required.
   * Sets the state of the ui as projects list closed.
   */
  openProjectsList() {
    if (this.workspace === undefined) {
      this.closeProjectsListBtn.classList.add('hidden');
    } else {
      this.closeProjectsListBtn.classList.remove('hidden');
    }
    this.projectsListContainer.style.display = 'block';
    this.projectsListBtn.dataset.open = 'true';
    // Hide the drawings and tools buttons
    this.drawingsBtns.style.display = 'none';
    this.toolbarsContainer.style.display = 'none';
    // If there is no projectsData or if there is only one fetch projects.
    if (this.projectsData === undefined || this.projectsData.length <= 1) {
      this.showViewportDialog('loader', 'Loading projects');
      API.listProjectItems(this).then(res => {
        this.createHTMLProjectsList(res);
        // Set the 'current' class in the current project.
        this.projectsList.childNodes.forEach(proj => {
          if (proj.dataset && proj.dataset.projId === this.workspace.projectId) {
            proj.classList.add('current');
            this.previousActiveItem = proj;
          }
        });
        this.hideViewportMessage();
      }, rej => {
        this.projectsList.innerHTML = '<p class="empty-msg">There are no projects. Upload one!</p>';
        this.hideViewportMessage();
      });
    }
  }

  /**
   * Create an HTML element with the project data provided.
   * @param {Object} projData Object with name, id and optional thumbId entries.
   */
  createProjectItem(projData) {
    const projItem = document.createElement('button');
    // Projects that have been uploaded but not send to the backend have an id of 'temporal'.
    if (projData.id === 'temporal') {
      projItem.classList.add('unsync');
    }
    projItem.dataset.projId = projData.id;
    projItem.dataset.name = projData.name;
    projItem.classList.add('projectItem');
    let projItemContent = [];
    if (projData.shared) {
      projItemContent.push('<img class="sharedIcon" src="src/assets/icons/shareIcon.svg">');
    }
    if (projData.thumbId) {
      projItemContent.push(`<img class="thumb" src="https://drive.google.com/uc?id=${projData.thumbId}">`);
    } else {
      projItemContent.push(`<svg class="thumb" xmlns="http://www.w3.org/2000/svg" viewBox="-100 -50 350 210"><path d="M143,10.44H65.27V7a7,7,0,0,0-7-7H7A7,7,0,0,0,0,7V103a7,7,0,0,0,7,7H65V70.18H85V110h58a7,7,0,0,0,7-7V17.41A7,7,0,0,0,143,10.44ZM125,53.49H105v-20h20Z" style="fill:#e6e6e6"/></svg>`);
    }
    projItemContent.push(`<h4>${projData.name}</h4>`);
    projItem.innerHTML = projItemContent.join('');
    return projItem;
  }

  /**
   * Receives an array of projects data and creates and appends the HTML items.
   * @param {Array} projectsData The project objects with the name, id and optional thumbId entries.
   */
  createHTMLProjectsList(projectsData) {
    projectsData.forEach(proj => {
      const projectItem = this.createProjectItem(proj);
      this.projectsList.appendChild(projectItem);
    });
    this.adjustItems();
  }

  /**
   * Adjusts the position of project items in the container.
   */
  adjustItems() {
    const itemsH = getComputedStyle(this.projectsList).getPropertyValue('--items-h');
    const itemsTotal = this.projectsList.children.length;
    this.projectsList.style.setProperty('--remaining-items', (Math.ceil(itemsTotal / itemsH) * itemsH) - itemsTotal);
  }

  /**
   *  Adds a new HTML element item to the list of projects.
   * @param {Object} projData Object with name, id and optional thumbId entries.
   */
  updateProjectsList(projData) {
    const projectItem = this.createProjectItem(projData);
    // Remove the 'no projects yet' message if it is the first.
    if (this.projectsData.length <= 1) {
      this.projectsList.querySelector('.empty-msg').remove();
    }
    this.projectsList.prepend(projectItem);
    this.adjustItems();
  }


  /*********************** MESSAGE CONTAINER ***********************/
  /*
   * A message that works as a feedback and that doesnt interrupt.
   */

  /**
  * Disaplays feedback message.
  * @param {String} message 
  * @param {String} type Use keywords 'success', 'warning' or 'error' to specify the type of message.
  * 
  */
  showMessage(type, message, timer) {
    // If the data-type attr has value is because the message is still open.
    if (this.messageContainer.dataset.type !== '') {
      this.messageContainer.classList.remove(this.messageContainer.dataset.type);
      if (this.messageTimerId) {
        clearTimeout(this.messageTimerId);
        this.messageTimerId = undefined;
      }
    } else {
      this.messageContainer.style.display = 'flex';
    }
    this.messageContainer.dataset.type = type;
    this.messageContainer.querySelector('p').innerText = message;
    switch (type) {
      case 'success':
        this.messageContainer.classList.add('success');
        break;
      case 'warning':
        this.messageContainer.classList.add('warning');
        break;
      case 'error':
        this.messageContainer.classList.add('error');
        break;
    }
    if (timer) {
      this.messageTimerId = setTimeout(() => this.closeMessage(), timer);
    }
  }

  /**
   * Closes the message container and removes the class that gives the type of message style.
   */
  closeMessage() {
    this.messageContainer.style.display = 'none';
    this.messageContainer.classList.remove(this.messageContainer.dataset.type);
    this.messageContainer.dataset.type = '';
    if (this.messageTimerId) {
      clearTimeout(this.messageTimerId);
      this.messageTimerId = undefined;
    }
  }


  /*********************** VIEWPORT MESSAGES ***********************/
  /*
   * A message on the middle of the viewport that interrupts.
   */

  /**
   * Manages the creation of a message on the viewport.
   * @param {String} type Values 'loader' or 'action'. If action an object with a function reference and a name should be provided.
   * @param {String} message 
   * @param {Array} actions Array of objects with name and function entries.
   */
  showViewportDialog(type, message, actions) {
    if (this.viewportMessage.querySelector('.btns-container')) {
      this.viewportMessage.querySelectorAll('.btns-container > button').forEach(btn => btn.onclick = null);
    }
    Generics.emptyNode(this.viewportMessage);
    // Create the new content.
    const innerContainer = document.createElement('div');
    if (type === 'loader') {
      innerContainer.innerHTML = `<p>${message}</p><svg class="svg-loader"><use href="#vaLoader"/></svg>`;
    } else if (type === 'action') {
      innerContainer.innerHTML = `<p>${message}</p>`;
      const btnsContainer = document.createElement('div');
      btnsContainer.classList.add('btns-container');
      actions.forEach(action => {
        const button = document.createElement('button');
        button.innerHTML = action.name;
        button.classList.add('buttonBase', 'light');
        button.onclick = action.function;
        btnsContainer.appendChild(button);
      });
      innerContainer.appendChild(btnsContainer);
    } else if (type === 'message') { // Is this one useful? Maybe with a setTimeout?
      innerContainer.innerHTML = '<p>' + message + '</p>';
    }
    this.viewportMessage.appendChild(innerContainer);
    this.viewportMessage.classList.add('active');
  }

  /**
   * Hides the viewport message if visible.
   */
  hideViewportMessage() {
    this.viewportMessage.classList.remove('active');
  }


  /********************* MODAL DIALOGS *********************/
  /*
   * All modal dialog contents are stored in a container and fetched when needed.
   */

  /**
   * Shows the modal dialog provided from the same document.
   * @param {HTMLElement} content Reference to the outer HTML element of the dialog.
   */
  showModalDialog(content) {
    this.modalDialogContent.appendChild(content);
    this.modalDialogContainer.style.display = 'flex';
  }

  /**
   * Hides the current modal dialog.
   */
  closeModalDialog() {
    const content = this.modalDialogContent.firstElementChild;
    this.modalDialogContainer.style.display = 'none';
    this.modalDialogsStorage.appendChild(content);
  }


  /********************* START THE APPLICATION *********************/

  /**
   * Starts the app, if a project id is provided it will start from that projec view.
   * If no project id is provided it will start from the projects list view.
   * @param {String} projectId Optional projectId to start.
   */
  start(projectId) {
    // Show the app interface.
    document.querySelector('header').style.display = 'flex';
    document.querySelector('main').style.display = 'block';
    // Start options depending if there is a projectId.
    if (projectId) {
      this.showViewportDialog('loader', 'Loading project');
      API.fetchProject(projectId, this)
        .then(res => {
          this.workspace = new Workspace(res, this);
          this.createHTMLProjectsList([res]);
          this.projectsListBtn.style.display = 'unset';
          this.hideViewportMessage();
        }, rej => {
          console.log(rej);
          const errorMessage = rej.body === undefined ? rej : `Message: ${JSON.parse(rej.body).error.message} Code: ${JSON.parse(rej.body).error.code}`;
          this.showViewportDialog('action', errorMessage, [
            {
              name: 'View projects list',
              function: () => {
                this.openProjectsList();
                if (location.search !== "") {
                  history.replaceState({ page: 'Projects list' }, 'Projects list', location.href.replace(location.search, ''));
                }
              }
            }
          ]);
        });
    } else {
      // Delete any invalid search parameter if any.
      if (location.search !== "") {
        history.replaceState({ page: 'Projects list' }, 'Projects list', location.href.replace(location.search, ''));
      }
      this.projectsListContainer.style.display = 'block';
      this.showViewportDialog('loader', 'Loading projects');
      // TODO: Limit the number of projects to list
      API.listProjectItems(this).then(res => {
        this.createHTMLProjectsList(res);
        this.hideViewportMessage();
      }, rej => {
        this.projectsList.innerHTML = '<p class="empty-msg">There are no projects. Upload one!</p>';
        this.hideViewportMessage();
      });
    }
  }
}