import Generics from './generics';
import { Comment } from './comment';
import { MainPanel } from './mainPanel';

export class Workspace {
  constructor(projectData, App) {
    this.projectName = projectData.name;
    this.projectId = projectData.id;
    this.projectIndex = App.projectsData.findIndex(obj => obj.name === projectData.name);
    if (projectData.id === App.lastUploadedProject.id) {
      this.drawings = App.lastUploadedProject.drawings;
      //this.drawingsStylesId = App.lastUploadedProject.drawingsStylesId;
      this.elementsData = App.lastUploadedProject.elementsData;
    } else {
      // Store the content of the drawings as entries name:'content'
      this.drawings = projectData.drawings;
      this.drawingsStylesId = projectData.drawingsStylesId;
      // TODO: Elements data could be changed to a similar system like the drawing objects.
      this.elementsData = {};
    }
    this.activeTool;
    // this.toolSettings;
    this.appendedDrawingsIds = [];
    this.activeDrawing; // Drawing object instance.
    // Set title of the project in the button to list the projects.
    App.projectsListBtn.innerHTML = '<span>' + projectData.name + '</span>';
    this.drawingsBtns = App.drawingsBtns;
    this.drawingsContainer = App.drawingsContainer;
    this.drawingsStylesTag;
    this.saveBtn = App.saveBtn;
    this.createDrawingsBtns(this.drawings);
    // Show drawings and tools buttons.
    this.drawingsBtns.children[0].innerText = 'Pick a drawing';
    this.drawingsBtns.style.display = 'unset';
    App.toolbarsContainer.style.display = 'flex';
    this.projectsData = App.projectsData;
    this.commentForm = document.getElementById('commentForm');
    this.dataTablesContainer = document.getElementById('dataTablesContainer');
    this.commentsChangesUnsaved;
    if (projectData.commentsFileId) {
      this.commentsFileId = projectData.commentsFileId;
    }
    this.comments = [];
    if (projectData.comments) {
      // TODO: Create the comment objects each time a workspace is created or before on the AppData.projectsData object?
      projectData.comments.forEach(comment => this.comments.push(new Comment(comment.elementId, comment.content)));
      this.drawings.forEach(drawing => drawing.commentsChanged = true);
    }
    this.mainPanel = new MainPanel(App.mainPanel, App.panelsStorage);
  }

  // TODO: Set a default 'activeDrawing' with the 'elementsData' tool active by default? this.activeTool = new ElementsData('elementsDataTool', this);


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
      this.activeTool = new Tool(name, e.currentTarget, this);
    } else if (this.activeTool.name !== name) {
      this.activeTool.kill();
      this.activeTool = new Tool(name, e.currentTarget, this);
    } else if (this.activeTool.name === name) {
      this.activeTool.kill();
      this.activeTool = undefined;
    }
  }


  unsavedCommentsData() {
    this.commentsChangesUnsaved = true;
    this.saveBtn.classList.remove('disabled');
    this.saveBtn.classList.add('enabled');
  }


  /********************** DRAWINGS MANAGEMENT **********************/

  /**
   * Manages the drawings visibility. The provided drawing object
   * should have the 'content' property already with value.
   * @param {Object} drawing 
   */
  setDrawing(drawing) {
    // If there is a previous visible drawing hide it.
    if (this.activeDrawing && this.activeDrawing.name !== drawing.name) {
      // If in the drawing to be hided there is a selection remove it.
      if (this.activeTool && this.activeTool.currentSelection && this.activeDrawing.content.querySelector('[data-id="' + this.activeTool.currentSelection.dataset.id + '"]')) {
        this.activeTool.deselect(this.activeTool.currentSelection);
      }
      this.activeDrawing.content.style.display = 'none';
    } else if (this.activeDrawing && this.activeDrawing.name === drawing.name) {
      return;
    }

    // Make it not visible until the end of the process. Use visibility
    // because some browsers like Chrome cannot draw new svg elements if
    // the canvas has 'display:none'.
    drawing.content.style.visibility = 'hidden';

    // If it is not in the DOM already append it.
    // If it is already in the DOM then remove the 'display:none'.
    if (!this.appendedDrawingsIds.includes(drawing.id)) {
      this.appendedDrawingsIds.push(drawing.id);
      this.drawingsContainer.append(drawing.content);
    } else {
      drawing.content.style.display = 'unset';
    }

    // If the value of commentsChanged is undefined then there are still
    // no comments in the project. If it is false then there are no changes.
    if (drawing.commentsChanged) {
      // Look for elements in the drawing that should have comment representation.
      // If still there is no comments group yet check the drawing, otherwise check
      // in the comments group. This way the comments group is added only if needed.
      if (drawing.commentsGroup === undefined) {
        let groupCreated = false;
        this.comments.forEach(comment => {
          if (drawing.content.querySelector('[data-id="' + comment.elementId + '"]') !== null) {
            // Only if at least one element is found the comments group is created.
            if (!groupCreated) {
              drawing.createCommentsGroup();
              // TODO: Set visibility of the group.
              groupCreated = true;
            }
            const element = drawing.content.querySelector('[data-id="' + comment.elementId + '"]');
            comment.createRepresentation(drawing.commentsGroup, element);
          }
        });
      } else {
        // Look for in the comments group, and add the missing ones.
        // Only if the element is in the drawing and it doesnt have representation.
        this.comments.forEach(comment => {
          if (drawing.content.querySelector('[data-id="' + comment.elementId + '"]') !== null && drawing.commentsGroup.querySelector('[data-id="' + comment.id + '"]') === null) {
            const element = drawing.content.querySelector('[data-id="' + comment.elementId + '"]');
            comment.createRepresentation(drawing.commentsGroup, element);
          }
        });
        // TODO: Set visibility of the group.
      }
      // Set the commentsChanged property to false to indicate that it is updated.
      drawing.commentsChanged = false;
    }

    // Update the 'activeDrawing' in the 'activeTool'.
    if (this.activeTool) {
      this.activeTool.activeDrawing = drawing;
    }
    if (this.activeTool && this.activeTool.currentSelection && drawing.content.querySelector('[data-id="' + this.activeTool.currentSelection.dataset.id + '"]')) {
      this.activeTool.currentSelection = drawing.content.querySelector('[data-id="' + this.activeTool.currentSelection.dataset.id + '"]');
      this.activeTool.select(this.activeTool.currentSelection);
    }

    drawing.content.style.visibility = 'unset';

    // Set the drawing as active.
    this.activeDrawing = drawing;
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
    // Empty the drawings buttons container.
    Generics.emptyNode(this.drawingsBtns.querySelector('.dropdown-content'));
    // Remove the create style tag for the styles of the drawings.
    if (this.drawingsStylesTag !== undefined)
      this.drawingsStylesTag.remove();
    // Remove the main panel.   
    //this.mainPanel.kill();
    // TODO: If in future version there are elements in the svg with event listeners those should be deleted
    this.drawingsContainer.innerHTML = '';
  }
}