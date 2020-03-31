import Generics from './generics';
import { Comment } from './comment';
import { MainPanel } from './mainPanel';
import { CommentForm } from './CommentForm';

export class Workspace {
  constructor(projectData, App) {
    this.projectName = projectData.name;
    this.projectId = projectData.id;
    this.permissions = projectData.permissions;
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
    this.propsTablesContainer = document.getElementById('propsTablesContainer');
    this.paramsTablesContainer = document.getElementById('paramsTablesContainer');
    this.commentsChangesUnsaved;
    if (projectData.commentsFileId) {
      this.commentsFileId = projectData.commentsFileId;
    }
    // Used to store arrays of all the comments that each element has, necessary when an element is clicked.
    this.elementsComments = {}; // TODO Populate it at start with the data at projectData.comments
    this.comments = [];
    if (projectData.comments) {
      // TODO: Create the comment objects each time a workspace is created or before on the AppData.projectsData object?
      projectData.comments.forEach(comment => this.comments.push(new Comment(comment.elementsIds, comment.content, comment.mentions)));
      this.drawings.forEach(drawing => drawing.commentsChanged = true);
    }
    this.pendingNotificationsToSend = [];
    this.mainPanel = new MainPanel(App.mainPanel, App.panelsStorage); // Since currently there can be only one workspace this should be better in the Application class.
    this.commentForm = new CommentForm(document.getElementById('commentForm'), this);
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
      // If in the drawing to be hidden there are selected elements remove their selection appearance.
      if (this.activeTool && this.activeTool.currentSelection.length > 0) {
        this.activeTool.removeDrawingSelectionAppearance(this.activeDrawing);
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
      // Update the comments representations for the new drawing.
      // If still there is no comments group check the drawing, otherwise check
      // the ones without representation in the comments group.
      if (drawing.commentsGroup === undefined) {
        let groupCreated = false;
        for (let j = 0; j < this.comments.length; j++) {
          const elemsForCommentRepresentation = [];
          for (let i = 0; i < this.comments[j].elementsIds.length; i++) {
            const element = drawing.content.querySelector('[data-id="' + this.comments[j].elementsIds[i] + '"]');
            if (element !== null)
              elemsForCommentRepresentation.push(element);
          }
          // If at least one is found create the representation.
          if (elemsForCommentRepresentation.length > 0) {
            // Only if at least one comment requires representation the comments group is created.
            if (!groupCreated) {
              drawing.createCommentsGroup();
              // TODO: Set visibility of the group.
              groupCreated = true;
            }
            this.comments[j].createRepresentation(drawing.commentsGroup, elemsForCommentRepresentation[0]);
          }
        }
      } else {
        // Look for in the comments group, and add the missing ones.
        // Only if the element is in the drawing and it doesnt have representation.
        for (let j = 0; j < this.comments.length; j++) {
          // If this element already has a representation in this drawing skip it.
          if (drawing.commentsGroup.querySelector('[data-id="' + this.comments[j].id + '"]') !== null) continue;
          // TODO Do something to avoid checking comments that doesnt have any element in this drawing.
          // If there is no representation for it get all its elements and if at least one is found create the representation.
          const elemsForCommentRepresentation = [];
          for (let i = 0; i < this.comments[j].elementsIds.length; i++) {
            const element = drawing.content.querySelector('[data-id="' + this.comments[j].elementsIds[i] + '"]');
            if (element !== null)
              elemsForCommentRepresentation.push(element);
          }
          if (elemsForCommentRepresentation.length > 0) {
            this.comments[j].createRepresentation(drawing.commentsGroup, elemsForCommentRepresentation[0]);
          }
        }
        // TODO: Set visibility of the group.
      }
      // Set the commentsChanged property to false to indicate that it is updated.
      drawing.commentsChanged = false;
    }

    // Update the 'activeDrawing' in the 'activeTool'.
    if (this.activeTool) {
      this.activeTool.activeDrawing = drawing;
    }

    // If there are selected elements in the new drawing add the selection appearance to them.
    if (this.activeTool && this.activeTool.currentSelection.length > 0) {
      this.activeTool.addDrawingSelectionAppearance(drawing);
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