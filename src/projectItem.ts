import API from './api';
import { ProjectData } from './types';
import type { Application } from './app';
import type { HTMLElementWithContext } from './contextMenu';

export class ProjectItem {
  HTMLContainer: HTMLElementWithContext;

  constructor(projectData: ProjectData, app: Application) {
    this.HTMLContainer = document.createElement('button');
    // Projects that have been uploaded but not send to the backend have an id of 'temporal'.
    if (projectData.id === 'temporal') {
      this.HTMLContainer.classList.add('unsync');
    }
    this.HTMLContainer.dataset.projId = projectData.id;
    this.HTMLContainer.dataset.name = projectData.name;
    this.HTMLContainer.classList.add('projectItem');
    let projItemContent = [];
    if (projectData.shared) {
      projItemContent.push('<svg class="sharedIcon"><use href="#sharedIcon" /></svg>');
    }
    if (projectData.thumbId) {
      projItemContent.push(`<img class="thumb" src="https://drive.google.com/uc?id=${projectData.thumbId}">`);
    } else {
      projItemContent.push(`<svg class="thumb" xmlns="http://www.w3.org/2000/svg" viewBox="-100 -50 350 210"><path d="M143,10.44H65.27V7a7,7,0,0,0-7-7H7A7,7,0,0,0,0,7V103a7,7,0,0,0,7,7H65V70.18H85V110h58a7,7,0,0,0,7-7V17.41A7,7,0,0,0,143,10.44ZM125,53.49H105v-20h20Z" style="fill:#e6e6e6"/></svg>`);
    }
    projItemContent.push(`<h4>${projectData.name}</h4>`);
    this.HTMLContainer.innerHTML = projItemContent.join('');

    // Indicate that this object has context menu.
    this.HTMLContainer.dataset.cxmenu = '';

    // Append a new property to the HTML container element with the context menu data.
    this.HTMLContainer.contextMenuData = [
      {
        name: 'Delete',
        action: () => {
          app.showViewportDialog('action', `Are you sure you want to delete the ${projectData.name} project?`, [
            {
              name: 'Delete',
              function: () => {
                app.showViewportDialog('loader', `Deleting ${projectData.name} project.`);
                API.deleteFile(projectData.id).then(res => {
                  this.HTMLContainer.remove();
                  const projIndex = app.projectsData.findIndex(proj => proj.id === projectData.id);
                  app.projectsData.splice(projIndex, 1);
                  // TODO check also if it is in the value of currentProject or lastUploadedProject and delete it as well
                  app.hideViewportMessage();
                  app.showMessage('success', ['Project deleted successfully']);
                }, err => {
                  app.hideViewportMessage();
                  app.showMessage('error', ['It was not possible to delete the project.', err.result.error.message]);
                });
              }
            },
            {
              name: 'Cancel',
              function: () => {
                app.hideViewportMessage();
              }
            }
          ]);
        }
      },
      {
        name: 'Share project',
        action: () => {
          app.shareProjectDialog.setUpDialog(projectData);
          app.showModalDialog(app.shareProjectDialog.htmlContainer);
          app.modalDialogContainer.classList.add('grayTranslucent');
        }
      },
      {
        name: 'Rename',
        action: () => {
          app.renameProjectDialog.setUpDialog(this.HTMLContainer);
          app.showModalDialog(app.renameProjectDialog.htmlContainer);
        }
      }
    ];
  }
}