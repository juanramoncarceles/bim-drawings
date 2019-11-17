export class Workspace {
  constructor(projectData) {
    this.projectName = projectData.name;
    this.projectId = projectData.id;
    this.projectIndex = App.projectData.findIndex(obj => obj.name === projectData.name);
    if (projectData.id === lastUploadedProject.id) {
      this.drawings = lastUploadedProject.drawings;
      this.elementsData = lastUploadedProject.elementsData;
    } else {
      this.drawings = {};
      this.elementsData = {};
    }
    // Set title of the project in the button to list the projects.
    App.projectsListBtn.innerHTML = '<span>' + projectData.name + '</span>';
    this.createDrawingsBtns(projectData.drawings);
    // Show drawings and tools buttons.
    App.drawingsBtns.children[0].innerText = 'Pick a drawing';
    App.drawingsBtns.style.display = 'unset';
    App.toolbarsContainer.style.display = 'flex';
  }

  projectName;

  projectId;

  // The div container with the svg drawing.
  activeDrawing;

  activeTool;

  drawings;

  elementsData;

  appendedDrawingsNames;

  selectedElementId;

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
    App.drawingsBtns.querySelector('.dropdown-content').innerHTML = drawingsItems.join('');
  }

  /**
  * Places the content of the svg drawing in the container.
  * @param {String} drawingName 
  */
  setDrawing(drawingName) {
    // If there is a visible drawing hide it.
    if (this.activeDrawing && this.activeDrawing.dataset.name !== drawingName) {
      if (this.selectedElementId && this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]')) {
        this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]').classList.remove('selected');
      }
      this.activeDrawing.style.display = 'none';
    } else if (this.activeDrawing && this.activeDrawing.dataset.name === drawingName) {
      return;
    }

    // If it is not in the container already append it. It will be visible.
    if (!this.appendedDrawingsNames.includes(drawingName)) {
      this.appendedDrawingsNames.push(drawingName);
      const container = document.createElement('div');
      container.dataset.name = drawingName;
      container.innerHTML = this.drawings[drawingName];
      App.drawingsContainer.append(container);
      this.activeDrawing = container;
    } else {
      this.activeDrawing = App.drawingsContainer.querySelector('div[data-name="' + drawingName + '"]');
      this.activeDrawing.style.display = 'unset';
    }

    if (this.selectedElementId && this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]')) {
      this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]').classList.add('selected');
    }
  }

  /**
  * Cleans the workspace by emptying the drawing container and the list of drawings.
  * TODO: Remove possible event listeners before emptying containers ?
  */
  close() {
    emptyNode(App.drawingsBtns.querySelector('.dropdown-content'));
    // TODO: If in future version there are elements in the svg with event listeners those should be deleted
    App.drawingsContainer.innerHTML = '';
  }
}