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
      // Store the content of the drawings as entries name:'content'
      this.drawings = projectData.drawings;
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
    this.createDrawingsBtns(this.drawings);
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


  // /**
  //  * Creates all the comments for the drawing if the commented element exists.
  //  * To be used when still there is no group for comments or if it is empty
  //  * because it doesnt check if the element has already the comment.
  //  * @param {*} drawing 
  //  * @param {*} commentsGroup 
  //  * @param {*} comments 
  //  */
  // createComments(drawing, commentsGroup, comments) { // Array of comment objects
  //   comments.forEach(comment => {
  //     if (drawing.querySelector('[data-id="' + comment.elementId + '"]') !== null) {
  //       // Creation of the ui comment.
  //       const element = drawing.querySelector('[data-id="' + comment.elementId + '"]');
  //       const uiComment = AddComment.createSvgComment(element, commentsGroup);
  //       comment.uiElements.push(uiComment);
  //     }
  //   });
  // }


  /********************** DRAWINGS MANAGEMENT **********************/

  /**
   * Manages the drawings visibility.
   * @param {String} drawingName 
   */
  setDrawing(drawingName) {
    // TODO: Set a default 'activeDrawing' with the 'elementsData' tool active by default? this.activeTool = new ElementsData('elementsDataTool', this);
    // If there is a visible drawing hide it.
    if (this.activeDrawing && this.activeDrawing.name !== drawingName) {
      // If in the drawing that is going to be hided there is an element selected remove the selection.
      if (this.activeTool && this.activeTool.currentSelection && this.activeDrawing.content.querySelector('[data-id="' + this.activeTool.currentSelection.dataset.id + '"]')) {
        this.activeTool.currentSelection.classList.remove('selected');
      }
      this.activeDrawing.content.style.display = 'none';
    } else if (this.activeDrawing && this.activeDrawing.name === drawingName) {
      return;
    }

    // If it is not in the container already append it. It will be visible.
    if (!this.appendedDrawingsNames.includes(drawingName)) {
      this.appendedDrawingsNames.push(drawingName);
      const drawing = this.drawings.find(d => d.name === drawingName);
      drawing.placeInDOM(this.drawingsContainer, this.comments);
      this.activeDrawing = drawing;
    } else {
      this.activeDrawing = this.drawings.find(drawing => drawing.name === drawingName);
      // Browers like Chrome doesnt calculate svg if it is display none, thats
      // why I change it for visibility while I add the comments if any. 
      this.activeDrawing.content.style.visibility = 'hidden';
      this.activeDrawing.content.style.display = 'unset';
      // If there are comments check if anyone is missing.
      if (this.comments.length > 0) {

        if (this.activeDrawing.commentsGroup !== undefined) {
          // TODO: Set visibility
          // For each comment check if it has a representation in the drawing and if not create it.
          this.comments.forEach(comment => {
            if (this.activeDrawing.commentsGroup.querySelector('[data-id="' + comment.id + '"]') === null) {
              // Creation if the ui comment.
              const element = this.activeDrawing.content.querySelector('[data-id="' + comment.elementId + '"]');
              const uiComment = AddComment.createSvgComment(element, this.activeDrawing.commentsGroup);
              comment.uiElements.push(uiComment);
            }
          });
        } else {
          this.activeDrawing.createCommentsGroup();
          // TODO: Set visibility
          this.activeDrawing.createComments(this.comments);
        }

      }
      this.activeDrawing.content.style.visibility = 'unset';
    }

    // Update the 'activeDrawing' in the 'activeTool'.
    if (this.activeTool) {
      this.activeTool.activeDrawing = this.activeDrawing;
    }
    if (this.activeTool && this.activeTool.currentSelection && this.activeDrawing.content.querySelector('[data-id="' + this.activeTool.currentSelection.dataset.id + '"]')) {
      this.activeTool.currentSelection = this.activeDrawing.content.querySelector('[data-id="' + this.activeTool.currentSelection.dataset.id + '"]');
      this.activeTool.currentSelection.classList.add('selected');
    }
  }

  /**
   * Creates the buttons for the drawings to be displayed.
   * @param {Array} drawings Array with the drawing objects.
   */
  createDrawingsBtns(drawings) {
    let drawingsItems = [];
    drawings.forEach(drawing => {
      // Could be that there is no id if the project was uploaded and it is only local.
      drawingsItems.push(`<li ${drawing.id ? 'data-id=\"' + drawing.id + '\"' : ''}>${drawing.name}</li>`);
    });
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