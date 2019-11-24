import Generics from './generics';
import { AddComment } from './appTools/addComment';

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
   * @param {Event} e
   * @param {Tool} Tool 
   * @param {String} name 
   */
  manageTools(e, Tool, name) {
    if (this.activeDrawing === undefined) {
      // TODO: Show a message saying that a drawing must be active.
      console.log('A drawing must be active.');
      return;
    }
    if (this.activeTool === undefined) {
      this.activeTool = new Tool(name, this);
      e.currentTarget.classList.add('btn-tool-enabled');
    } else if (this.activeTool.name !== name) {
      this.activeTool.kill();
      this.activeTool = new Tool(name, this);
      e.currentTarget.classList.add('btn-tool-enabled');
    } else if (this.activeTool.name === name) {
      this.activeTool.kill();
      this.activeTool = undefined;
      e.currentTarget.classList.remove('btn-tool-enabled');
    }
  }


  /**
   * Creates all the comments for the drawing if the commented element exists.
   * To be used when still there is no group for comments or if it is empty
   * because it doesnt check if the element has already the comment.
   * @param {*} drawing 
   * @param {*} commentsGroup 
   * @param {*} comments 
   */
  createComments(drawing, commentsGroup, comments) { // Array of comment objects
    comments.forEach(comment => {
      if (drawing.querySelector('[data-id="' + comment.elementId + '"]') !== null) {
        // Creation of the ui comment.
        const element = drawing.querySelector('[data-id="' + comment.elementId + '"]');
        const uiComment = AddComment.createSvgComment(element, commentsGroup);
        comment.uiElements.push(uiComment);
      }
    });
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
      // If in the drawing that is going to be hided there is an element selected remove the selection.
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
      container.style.visibility = 'hidden';
      // Important: It should be appened before crating comments,
      // otherwise those will not be created correctly.
      this.drawingsContainer.append(container);
      // Add the comments to the svg if there are any.
      if (this.comments.length > 0) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('comments', '');
        // TODO: Set visibility
        const domparser = new DOMParser();
        const svg = domparser.parseFromString(this.drawings[drawingName], 'image/svg+xml').documentElement;
        // Append everything before creating the comments.
        container.appendChild(svg);
        svg.appendChild(group);
        this.createComments(svg, group, this.comments);
      } else {
        container.innerHTML = this.drawings[drawingName];
      }
      this.activeDrawing = container;
      this.activeDrawing.style.visibility = 'unset';
    } else {
      this.activeDrawing = this.drawingsContainer.querySelector('div[data-name="' + drawingName + '"]');
      // Browers like Chrome doesnt calculate svg if it is display none, that why
      // I change it for visibility while I add the comments if any. 
      this.activeDrawing.style.visibility = 'hidden';
      this.activeDrawing.style.display = 'unset';
      // If there are comments check if anyone is missing.
      if (this.comments.length > 0) {
        if (this.activeDrawing.querySelector('g[comments]') !== null) {
          const svgCommentsGroup = this.activeDrawing.querySelector('g[comments]');
          // TODO: Set visibility
          // For each comment check if it has a representation in the drawing and if not create it.
          this.comments.forEach(comment => {
            if (svgCommentsGroup.querySelector('[data-id="' + comment.id + '"]') === null) {
              // Creation if the ui comment.
              const element = this.activeDrawing.querySelector('[data-id="' + comment.elementId + '"]');
              const uiComment = AddComment.createSvgComment(element, svgCommentsGroup);
              comment.uiElements.push(uiComment);
            }
          });
        } else {
          const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          group.setAttribute('comments', '');
          // TODO: Set visibility
          this.activeDrawing.querySelector('svg').appendChild(group);
          this.createComments(this.activeDrawing, group, this.comments);
        }
      }
      this.activeDrawing.style.visibility = 'unset';
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