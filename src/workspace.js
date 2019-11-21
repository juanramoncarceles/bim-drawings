import Generics from './generics';
import API from './api';

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
    // this.toolSettings
    this.selectedElementId;
    this.appendedDrawingsNames = [];
    // activeDrawing: The div container with the svg drawing.
    this.activeDrawing;
    // Set title of the project in the button to list the projects.
    App.projectsListBtn.innerHTML = '<span>' + projectData.name + '</span>';
    this.drawingsBtns = App.drawingsBtns;
    this.drawingsContainer = App.drawingsContainer;
    this.createDrawingsBtns(projectData.drawings);
    // Show drawings and tools buttons.
    this.drawingsBtns.children[0].innerText = 'Pick a drawing';
    this.drawingsBtns.style.display = 'unset';
    App.toolbarsContainer.style.display = 'flex';
    this.manageSelection = this.manageSelection.bind(this);
    this.drawingsContainer.addEventListener('click', this.manageSelection);
    this.projectsData = App.projectsData;
    this.commentForm = document.getElementById('commentForm');
    this.comments = [];
  }


  /********************* SELECTION OF ELEMENTS *********************/

  /**
   * Manages the selection and deselection of the svg elemenets.
   * TODO: separate the 'showElementData' method
   * @param {MouseEvent} e The click event.
   */
  manageSelection(e) {
    const clickedElement = e.target.closest('[selectable]');
    if (clickedElement) {
      if (!this.selectedElementId) {
        clickedElement.classList.add('selected');
        this.showElementData(clickedElement.dataset.category, clickedElement.dataset.id);
        this.selectedElementId = clickedElement.dataset.id;
      } else if (clickedElement.dataset.id !== this.selectedElementId) {
        if (this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]')) {
          this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]').classList.remove('selected');
        }
        clickedElement.classList.add('selected');
        this.showElementData(clickedElement.dataset.category, clickedElement.dataset.id);
        this.selectedElementId = clickedElement.dataset.id;
      }
    } else if (this.selectedElementId) {
      if (this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]')) {
        this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]').classList.remove('selected');
      }
      this.selectedElementId = undefined;
    }
  }

  /**
   * Sets the selected tool as active and turns off the previous one if still active.
   * @param {Tool} Tool 
   * @param {String} name 
   */
  manageTools(Tool, name) { // TODO, add 'e' as param if needed
    if (this.activeDrawing === undefined) return; // TODO: Show a message saying that a drawing must be active
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


  /******************** ELEMENTS ASSOCIATED DATA *******************/

  /**
   * Shows the data associated with the selected element by fetching it if needed.
   * @param {String} category 
   * @param {String} id 
   */
  showElementData(category, id) {
    if (this.elementsData[category]) {
      console.log(this.elementsData[category].instances[id]);
    } else {
      const categoryData = this.projectsData[this.projectIndex].elementsData.find(obj => obj.name.replace('.json', '') === category);
      if (categoryData !== undefined) {
        // show a loader in the table ?
        API.getFileContent(categoryData.id).then(res => {
          this.elementsData[category] = JSON.parse(res.body);
          // hide the possible loader ?
          console.log(this.elementsData[category].instances[id]);
        }, err => {
          // hide the possible loader ?
          console.log(err);
        });
      } else {
        console.log('There is no data for that element.');
      }
    }
  }


  /********************** DRAWINGS MANAGEMENT **********************/

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
      this.drawingsContainer.append(container);
      this.activeDrawing = container;
    } else {
      this.activeDrawing = this.drawingsContainer.querySelector('div[data-name="' + drawingName + '"]');
      this.activeDrawing.style.display = 'unset';
    }
    if (this.selectedElementId && this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]')) {
      this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]').classList.add('selected');
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
    this.drawingsContainer.removeEventListener('click', this.manageSelection);
  }
}