import API from './api';
import { Workspace } from './workspace';
import Generics from './generics';
import { AddComment } from './appTools/addComment';
import { ShowElementData } from './appTools/elementData';
import { ShareProject } from './shareProject';
import { NotificationsManager } from './notificationsManager';
import { RenameProject } from './renameProject';
import { ContextMenu } from './contextMenu';
import { ProjectItem } from './projectItem';
import { ProjectData, NotificationToSend } from './types';

interface DialogAction {
  name: string;
  function: (this: GlobalEventHandlers, e: MouseEvent) => any;
}

export class Application {
  appMainFolderId: string;
  // Array of objects with data like 'name' and 'id' of the projects.
  projectsData: ProjectData[];
  appSettingsFolderId: string;
  thumbsFolderId: string;
  // If a user is logged it profile info is stored here.
  userInfo: gapi.client.drive.User;
  userInfoContainer: HTMLElement;
  // The current workspace object will be referenced here.
  currentWorkspace: Workspace;
  workspacesContainer: HTMLElement;
  lastUploadedProject: ProjectData;
  // Stores the active item in the projects list.
  previousActiveItem: HTMLElement;
  projectsListBtn: HTMLElement;
  drawingsBtns: HTMLElement;
  toolbarsContainer: HTMLElement;
  // Modal dialog.
  modalDialogContainer: HTMLElement;
  modalDialogContent: HTMLElement;
  modalDialogsStorage: HTMLElement;
  closeModalBtn: HTMLElement;
  // Viewport message.
  viewportMessage: HTMLElement;
  // Projects list.
  projectsListContainer: HTMLElement;
  projectsList: HTMLElement;
  closeProjectsListBtn: HTMLElement;
  // Panels storage.
  panelsStorage: HTMLElement;
  // Save button.
  saveBtn: HTMLElement;
  // Upload project form
  uploadFileForm: HTMLElement;
  fileInput: HTMLInputElement;
  submitFileBtn: HTMLElement;
  // Rename project form
  renameProjectDialog: RenameProject;
  // Share project form
  shareProjectDialog: ShareProject;
  // Message container
  messageContainer: HTMLElement;
  messageTimerId: number;
  // Notifications manager
  notificationsManager: NotificationsManager;
  // Context menu
  contextMenu: ContextMenu;
  commentsChangesUnsaved: boolean;

  constructor() {
    this.userInfoContainer = document.getElementById('user-info');
    this.workspacesContainer = document.getElementById('workspaces');
    this.projectsListBtn = document.getElementById('projectsListBtn');
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
    this.viewportMessage = document.getElementById('viewportMessage'); // TODO Create as a new component of the workspace
    // Projects list.
    this.projectsListContainer = document.getElementById('projectsListContainer');
    this.projectsList = document.getElementById('projectsList');
    this.closeProjectsListBtn = document.getElementById('closeProjectsListBtn');
    // Panels storage.
    this.panelsStorage = document.getElementById('panelsStorage');
    // Save button.
    this.saveBtn = document.getElementById('saveBtn');
    this.saveCommentsData = this.saveCommentsData.bind(this);
    this.saveBtn.onclick = this.saveCommentsData;
    // Projects list.
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
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.submitFileBtn = this.uploadFileForm.querySelector('button[type="submit"]');
    // Show the upload project form.
    document.getElementById('newProjectBtn').addEventListener('click', () => {
      this.showModalDialog(this.uploadFileForm);
      this.modalDialogContainer.classList.add('grayTranslucent');
    });
    // Hide the upload project form.
    // document.getElementById('closeUploadForm').addEventListener('click', () => {
    //   this.closeModalDialog(this.uploadFileForm);
    //   this.modalDialogContainer.classList.remove('grayTranslucent');
    // });
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
      (this.fileInput.nextElementSibling as HTMLElement).style.display = 'none';
      const file = ((e.target as HTMLFormElement).elements.namedItem("file") as HTMLInputElement).files[0];
      // TODO: Show some real progress while creating the project.
      API.createProject(file, this, this.lastUploadedProject).then((res: ProjectData) => {
        this.updateProjectsList(res);
        this.closeModalDialog();
        this.showMessage('success', 'Project uploaded successfully.');
        this.fileInput.value = '';
        // Reset upload form UI.
        document.getElementById('loadingFile').style.display = 'none';
        this.fileInput.nextElementSibling.innerHTML = 'Choose a file';
        this.submitFileBtn.innerHTML = 'Upload';
        (this.fileInput.nextElementSibling as HTMLElement).style.display = 'unset';
      }, err => {
        this.closeModalDialog();
        this.updateProjectsList(this.lastUploadedProject);
        console.error(err);
      });
    }
    /******************** Rename project form *********************/
    this.renameProjectDialog = new RenameProject(document.getElementById('renameProjectForm'), this);
    /********************* Share project form *********************/
    this.shareProjectDialog = new ShareProject(document.getElementById('shareProjectDialog'), this);
    /********************** Message container **********************/
    this.messageContainer = document.getElementById('messageContainer');
    this.closeMessage = this.closeMessage.bind(this);
    this.messageContainer.querySelector('button').onclick = this.closeMessage;
    /*************** Projects list items distribution **************/
    window.onresize = this.adjustItems;
    /**************** Tools buttons event listeners ****************/
    // TODO: This would make more sense as part of the workspace ?
    document.getElementById('tool-4').addEventListener('click', (e) => this.currentWorkspace.manageTools(e, ShowElementData, 'elementsDataTool'));
    document.getElementById('tool-5').addEventListener('click', (e) => this.currentWorkspace.manageTools(e, AddComment, 'commentsTool'));
    /******************** Notifications manager ********************/
    this.notificationsManager = new NotificationsManager();
    /************************ Context menu *************************/
    this.contextMenu = new ContextMenu();
  }


  /**
   * Stores the current logged user info as a property of the app and
   * populates the UI with the user info.
   */
  async setUserInfo() {
    const userInfoRes = await API.getUserInfo();
    this.userInfo = JSON.parse(userInfoRes.body).user;
    this.userInfoContainer.innerHTML = `
      <img src=${this.userInfo.photoLink}>
      <span>
        <span>${this.userInfo.displayName}</span><span class="email">${this.userInfo.emailAddress}</span>
      </span>`;
  }


  /**
   * Saves the comments data using the comments array from the current workspace.
   * It also notifies the mentioned collaborators in the comments if any was mentioned in new comments.
   * It creates the file (comments.json) if it still doesnt exist or updates its contents if it exists.
   */
  async saveCommentsData() {
    if (this.currentWorkspace && this.currentWorkspace.commentsChangesUnsaved) {
      this.commentsChangesUnsaved = false;
      this.saveBtn.classList.remove('enabled');
      this.saveBtn.classList.add('progress');
      let savingSuccessful;
      // Collect the data to save in backend.
      const dataToSave: Object[] = [];
      this.currentWorkspace.comments.forEach(comment => {
        dataToSave.push({
          elementsIds: comment.elementsIds,
          content: comment.content,
          mentions: comment.mentions
        });
      });
      const jsonDataToSave = JSON.stringify(dataToSave);
      // If there is no id for the comments.json file create the file with the contents and get the id of it.
      if (!this.currentWorkspace.commentsFileId) {
        const commentsFileCreationRes = await API.uploadFile(jsonDataToSave, 'application/json', 'comments.json', this.currentWorkspace.projectId);
        if (commentsFileCreationRes.ok && commentsFileCreationRes.status === 200) {
          try {
            const decoder = new TextDecoder('utf-8');
            let { value, done } = await commentsFileCreationRes.body.getReader().read();
            const id = JSON.parse(decoder.decode(value)).id;
            // Set the id of the comments.json file that has been created.
            this.currentWorkspace.commentsFileId = id;
            savingSuccessful = true;
          } catch (err) {
            console.log('Error decoding the new comments.json file id: ', err); // JSON.parse(err.body).error.message
          }
        } else {
          savingSuccessful = false;
          // TODO: Delete existing created file/s with name 'comments.json', if there is no id then use the name?
        }
      } else {
        // Update the existing comments.json file.
        const commentsFileUpdateRes = await API.updateFileContent(jsonDataToSave, 'application/json', this.currentWorkspace.commentsFileId);
        if (commentsFileUpdateRes.ok && commentsFileUpdateRes.status === 200) {
          savingSuccessful = true;
        }
      }
      // If savingSuccessful proceed with the notifications if any.
      if (savingSuccessful && this.currentWorkspace.pendingNotificationsToSend.length > 0) {
        const notificationsPromises: Promise<Response>[] = [];
        this.currentWorkspace.pendingNotificationsToSend.forEach((n: NotificationToSend) => { // TODO change any
          const notificationPromise = API.sendNotification(n.emails, n.userName, n.userPhoto, n.textContent, n.projectName, n.projectId);
          notificationsPromises.push(notificationPromise);
        });
        await Promise.all(notificationsPromises).then(responses => {
          console.log('Users notified successfully');
          this.currentWorkspace.pendingNotificationsToSend.length = 0;
          // responses.forEach(res => console.log(res));
        }, err => {
          console.warn('Users couldn\'t be notified. ', err);
        });
      }
      if (savingSuccessful) {
        this.saveBtn.classList.remove('progress');
        this.saveBtn.classList.add('disabled');
        console.log('Data saved successfully.');
      } else {
        this.commentsChangesUnsaved = true;
        this.saveBtn.classList.remove('progress');
        this.saveBtn.classList.add('enabled');
        this.showMessage('error', 'Something went wrong and data could not be saved.');
        console.error('Something went wrong trying to save. Retry again.');
      }
    }
  }


  /************************ THE PROJECTS LIST ************************/

  /**
   * Selects a project from the list and manages its resources before opening the project.
   * @param e Mouse click event.
   */
  goToProject(e: MouseEvent) {
    const projectItem = (e.target as HTMLElement).closest('[data-proj-id]') as HTMLElement;
    if (projectItem === null) {
      return;
    }
    // If it is the current project close the list window.
    if (this.currentWorkspace && this.currentWorkspace.projectId === projectItem.dataset.projId) {
      return;
    }
    // TODO: If there have been changes in the project ask to save or discard them before closing it.
    // TODO: If it was an offline project try to sync it before closing it. The id would be 'temporal' and the contents in currentProject
    if (this.lastUploadedProject && projectItem.dataset.projId === this.lastUploadedProject.id) {
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
   */
  openProject(project: ProjectData) {
    if (this.currentWorkspace) {
      this.currentWorkspace.close();
    }
    this.currentWorkspace = new Workspace(project, this);
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
    if (this.currentWorkspace === undefined) {
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
      API.listProjectItems(this).then((res: ProjectData[]) => {
        this.createHTMLProjectsList(res);
        // Set the 'current' class in the current project.
        this.projectsList.childNodes.forEach((proj: HTMLElement) => {
          if (proj.dataset && proj.dataset.projId === this.currentWorkspace.projectId) {
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
   * Receives an array of projects data and creates and appends the HTML items.
   */
  createHTMLProjectsList(projectsData: ProjectData[]) {
    projectsData.forEach(projData => {
      const projectItem = new ProjectItem(projData, this);
      this.projectsList.appendChild(projectItem.HTMLContainer);
    });
    this.adjustItems();
  }

  /**
   * Adjusts the position of project items in the container.
   */
  adjustItems() {
    const itemsH = Number(getComputedStyle(this.projectsList).getPropertyValue('--items-h'));
    const itemsTotal = this.projectsList.children.length;
    this.projectsList.style.setProperty('--remaining-items', ((Math.ceil(itemsTotal / itemsH) * itemsH) - itemsTotal).toString());
  }

  /**
   *  Adds a new HTML element item to the list of projects.
   */
  updateProjectsList(projData: ProjectData) {
    // Remove the 'no projects yet' message if it is the first.
    if (this.projectsData.length <= 1) {
      this.projectsList.querySelector('.empty-msg').remove();
    }
    const projectItem = new ProjectItem(projData, this);
    this.projectsList.prepend(projectItem.HTMLContainer);
    this.adjustItems();
  }


  /*********************** MESSAGE CONTAINER ***********************/
  /*
   * A message that works as a feedback and that doesnt interrupt.
   */

  /**
  * Disaplays feedback message.
  * @param type Use keywords 'success', 'warning' or 'error' to specify the type of message.
  * @param message The actual message.
  * @param timer Optional. Time (ms) before it autocloses.
  */
  showMessage(type: string, message: string, timer: number = undefined) {
    // If the data-type attr has value is because the message is still open.
    if (this.messageContainer.dataset.type !== '') {
      this.messageContainer.classList.remove(this.messageContainer.dataset.type);
      if (this.messageTimerId) {
        window.clearTimeout(this.messageTimerId);
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
      this.messageTimerId = window.setTimeout(() => this.closeMessage(), timer);
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
   * @param type If 'action' a DialogAction[] with at least one object should be provided.
   */
  showViewportDialog(type: 'loader' | 'message' | 'action', message: string, actions: DialogAction[] = []) {
    if (this.viewportMessage.querySelector('.btns-container')) {
      this.viewportMessage.querySelectorAll('.btns-container > button').forEach((btn: HTMLElement) => btn.onclick = null);
    }
    Generics.emptyNode(this.viewportMessage);
    // Create the new content.
    const innerContainer = document.createElement('div');
    if (type === 'loader') {
      innerContainer.innerHTML = `<p>${message}</p><svg class="svg-loader"><use href="#vaLoader"/></svg>`;
    } else if (type === 'action' && actions.length > 0) {
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
   * @param content Reference to the outer HTML element of the dialog.
   * @param background It can be 'translucent' or 'opaque'. Default value is 'translucent'.
   * @param closable Wheater to show a button to close it or not. By deafult it has a button.
   */
  showModalDialog(content: HTMLElement, background = 'translucent', closable = true) {
    this.modalDialogContainer.classList.value = '';
    if (background === 'translucent') {
      this.modalDialogContainer.classList.add('grayTranslucent');
    } else if (background === 'opaque') {
      this.modalDialogContainer.classList.add('lightOpaque');
    }
    if (closable) {
      this.closeModalBtn.style.display = 'unset';
    } else {
      this.closeModalBtn.style.display = 'none';
    }
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
   */
  start(projectId: string = '') {
    // Show the app interface.
    document.querySelector('header').style.display = 'flex';
    document.querySelector('main').style.display = 'block';
    // Start options depending if there is a projectId.
    if (projectId !== '') {
      this.showViewportDialog('loader', 'Loading project');
      API.fetchProject(projectId, this)
        .then(res => {
          this.currentWorkspace = new Workspace(res, this);
          this.createHTMLProjectsList([res]);
          this.projectsListBtn.style.display = 'unset';
          this.hideViewportMessage();
          // If the project has collaborators asks the device token
          // in case it is needed to receive notifications.
          // TODO: If this project doest have collaborators but other yes I
          // would need to know otherwise the device token would not be asked.
          // TODO: Check if any of the project folders has more than one permission.
          if (res.permissions.length > 1) {
            window.saveMessagingDeviceToken();
          }
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
      API.listProjectItems(this).then((res: ProjectData[]) => {
        this.createHTMLProjectsList(res);
        this.hideViewportMessage();
        // Checks if at least one project has collaborators and if so asks for the
        // device messaging token that could be needed to receive notifications.
        if (window.thereIsMessaging) {
          for (let i = 0; i < res.length; i++) {
            if (res[i].permissions.length > 1) {
              window.saveMessagingDeviceToken();
              break;
            }
          }
        }
      }, rej => {
        this.projectsList.innerHTML = '<p class="empty-msg">There are no projects. Upload one!</p>';
        this.hideViewportMessage();
      });
    }
  }
}