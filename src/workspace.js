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
    this.activeTool;
    // this.toolSettings;
    this.appendedDrawingsNames = [];
    this.activeDrawing; // The div container with the svg drawing.
    // Set title of the project in the button to list the projects.
    App.projectsListBtn.innerHTML = '<span>' + projectData.name + '</span>';
    this.drawingsBtns = App.drawingsBtns;
    this.drawingsContainer = App.drawingsContainer;
    this.createDrawingsBtns(projectData.drawings);
    // Show drawings and tools buttons.
    this.drawingsBtns.children[0].innerText = 'Pick a drawing';
    this.drawingsBtns.style.display = 'unset';
    App.toolbarsContainer.style.display = 'flex';
    this.projectsData = App.projectsData;
    this.commentForm = document.getElementById('commentForm');
    this.comments = [];
  }


  /*********************** TOOLS MANAGEMENT ************************/

  /**
   * Sets the selected tool as active and turns off the previous one if still active.
   * @param {Tool} Tool 
   * @param {String} name 
   */
  manageTools(Tool, name) { // TODO, add 'e' as param if needed
    if (this.activeDrawing === undefined) {
      // TODO: Show a message saying that a drawing must be active.
      return;
    }
    if (this.activeTool === undefined) {
      this.activeTool = new Tool(name, this);
      // e.currentTarget.classList.add('active');
    } else if (this.activeTool.name !== name) {
      this.activeTool.kill();
      this.activeTool = new Tool(name, this);
      // e.currentTarget.classList.add('active');
    } else if (this.activeTool.name === name) {
      this.activeTool.kill();
      this.activeTool = undefined;
      // e.currentTarget.classList.remove('active');
    }
  }


  /********************** DRAWINGS MANAGEMENT **********************/

  /**
   * Places the content of the svg drawing in the container.
   * @param {String} drawingName 
   */
  setDrawing(drawingName) {
    // TODO: Set a default 'activeDrawing' with the 'elementsData' tool active by default? this.activeTool = new ElementsData('elementsDataTool', this);
    // If there is a visible drawing hide it.
    if (this.activeDrawing && this.activeDrawing.dataset.name !== drawingName) {
      if (this.activeTool && this.activeTool.currentSelection && this.activeDrawing.querySelector('[data-id="' + this.activeTool.currentSelection.dataset.id + '"]')) {
        this.activeTool.currentSelection.classList.remove('selected');
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
      this.drawingsContainer.append(container);
      this.activeDrawing = container;
    } else {
      this.activeDrawing = this.drawingsContainer.querySelector('div[data-name="' + drawingName + '"]');
      this.activeDrawing.style.display = 'unset';
    }
    // Update also the 'activeDrawing' in the 'activeTool'.
    if (this.activeTool) { this.activeTool.activeDrawing = this.activeDrawing; }
    if (this.activeTool && this.activeTool.currentSelection && this.activeDrawing.querySelector('[data-id="' + this.activeTool.currentSelection.dataset.id + '"]')) {
      this.activeTool.currentSelection = this.activeDrawing.querySelector('[data-id="' + this.activeTool.currentSelection.dataset.id + '"]');
      this.activeTool.currentSelection.classList.add('selected');
    }
  }

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