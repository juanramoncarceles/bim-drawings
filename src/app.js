import API from './api';
import { Workspace } from './workspace';
import { ProjectData } from './projectData';
import Generics from './generics';
import { AddComment } from './appTools/addComment';
import { ElementData } from './appTools/elementData';

export class Application {
  constructor() {
    this.appMainFolderId = undefined;
    // projectsData: Array of objects with data like name and id of the projects.
    this.projectsData = undefined;
    this.appSettingsFolderId = undefined;
    this.thumbsFolderId = undefined;
    this.workspace = undefined;
    this.lastUploadedProject = new ProjectData();
    // Stores the active item in the projects list.
    this.previousActiveItem;
    this.projectsListBtn = document.getElementById('projectsListBtn');
    this.drawingsContainer = document.getElementById('drawingsContainer');
    this.drawingsBtns = document.getElementById('drawingsBtns');
    this.toolbarsContainer = document.getElementById('toolbarsContainer');
    this.modalDialogContainer = document.getElementById('modalDialogContainer');
    this.modalDialogsStorage = document.getElementById('modalDialogsStorage');
    this.viewportMessage = document.getElementById('viewportMessage');
    this.projectsListContainer = document.getElementById('projectsListContainer');
    this.projectsList = document.getElementById('projectsList');
    this.closeProjectsListBtn = document.getElementById('closeProjectsListBtn');
    this.showProjectsList = this.showProjectsList.bind(this);
    this.projectsListBtn.addEventListener('click', this.showProjectsList);
    this.closeProjectsListBtn.addEventListener('click', () => {
      this.projectsListContainer.style.display = 'none';
      this.drawingsBtns.style.display = 'unset';
      this.toolbarsContainer.style.display = 'flex';
    });
    this.projectsList.addEventListener('click', e => {
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
        this.goToProject(this.lastUploadedProject);
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
            this.goToProject(res);
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
    });
    window.onresize = this.adjustItems;
    // TODO: This would make more sense as part of the workspace ?
    document.getElementById('tool-4').addEventListener('click', () => this.workspace.manageTools(AddComment, 'commentsTool'));
    document.getElementById('tool-3').addEventListener('click', () => this.workspace.manageTools(ElementData, 'elementsDataTool'));
  }


  /************************ THE PROJECTS LIST ************************/

  /**
   * Sets the workspace with the provided project.
   * @param {Object} project Data of the project. Id, name, drawings ids and elementsData files ids.
   */
  goToProject(project) {
    if (this.workspace) {
      this.workspace.close();
    }
    this.workspace = new Workspace(project, this);
    this.projectsListContainer.style.display = 'none';
    history.replaceState({ projectTitle: project.name }, project.name, "?id=" + project.id); // encodeURIComponent ? use pushState() ?
  }

  /**
   * Shows the list of projects container and fetches projects if required.
   */
  showProjectsList() {
    console.log('Show the projects list.');
    if (this.workspace !== undefined) {
      this.closeProjectsListBtn.style.display = 'unset';
    } else {
      this.closeProjectsListBtn.style.display = 'none';
    }
    this.projectsListContainer.style.display = 'block';
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
   * All modal dialogs are stored in a container and fetched when needed.
   */

  /**
   * Shows the modal dialog provided from the same document.
   * @param {HTMLElement} dialog Reference to the outer HTML element of the dialog.
   */
  showModalDialog(dialog) {
    this.modalDialogContainer.appendChild(dialog);
    this.modalDialogContainer.style.display = 'flex';
  }

  /**
   * Hides the modal dialog provided from the same document.
   * @param {HTMLElement} dialog Reference to the outer HTML element of the dialog.
   */
  closeModalDialog(dialog) {
    this.modalDialogContainer.style.display = 'none';
    this.modalDialogsStorage.appendChild(dialog);
  }


  /********************* START THE APPLICATION *********************/

  /**
   * Method called at start and behaves differently depending if the url contains an id of a project or not.
   */
  start() {
    // Hide the login dialog in case it was visible.
    this.closeModalDialog(authorizeDialog);
    // Show the app interface.
    document.querySelector('header').style.display = 'flex';
    document.querySelector('main').style.display = 'block';
    // Get the URL params.
    const resourceId = Generics.getUrlParams(window.location.href).id;
    if (resourceId) {
      this.showViewportDialog('loader', 'Loading project');
      API.fetchProject(resourceId, this)
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
                this.showProjectsList();
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