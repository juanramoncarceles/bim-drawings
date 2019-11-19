import Generics from './generics';

export class Workspace {
  constructor(projectData, App) {
    this.projectName = projectData.name;
    this.projectId = projectData.id;
    this.projectIndex = App.projectsData.findIndex(obj => obj.name === projectData.name);
    if (projectData.id === App.lastUploadedProject.id) {
      this.drawings = App.lastUploadedProject.drawings;
      this.elementsData = App.lastUploadedProject.elementsData;
    } else {
      this.drawings = {};
      this.elementsData = {};
    }
    // Set title of the project in the button to list the projects.
    App.projectsListBtn.innerHTML = '<span>' + projectData.name + '</span>';
    this.drawingsBtns = App.drawingsBtns;
    this.drawingsContainer = App.drawingsContainer;
    this.createDrawingsBtns(projectData.drawings);
    // Show drawings and tools buttons.
    this.drawingsBtns.children[0].innerText = 'Pick a drawing';
    this.drawingsBtns.style.display = 'unset';
    App.toolbarsContainer.style.display = 'flex';
  }

  // The div container with the svg drawing.
  //activeDrawing;

  //activeTool;

  //appendedDrawingsNames;

  //selectedElementId;

  /**
  * Creates the buttons for the drawings to be displayed.
  * @param {Object} drawings Object with the drawings, each entry has the name as key.
  */
  createDrawingsBtns(drawings) {
    let drawingsItems = [];
    for (const drawingName in drawings) {
      // Could be that there is no id if the project was uploaded and it is only local.
      drawingsItems.push(`<li ${drawings[drawingName].id ? 'data-id=\"' + drawings[drawingName].id + '\"' : ''}>${drawingName}</li>`);
    }
    this.drawingsBtns.querySelector('.dropdown-content').innerHTML = drawingsItems.join('');
  }

  /**
  * Cleans the workspace by emptying the drawing container and the list of drawings.
  * TODO: Remove possible event listeners before emptying containers ?
  */
  close() {
    Generics.emptyNode(this.drawingsBtns.querySelector('.dropdown-content'));
    // TODO: If in future version there are elements in the svg with event listeners those should be deleted
    this.drawingsContainer.innerHTML = '';
  }
}