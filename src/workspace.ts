import Generics from './generics';
import { Comment } from './comment';
import { MainPanel } from './mainPanel';
import { CommentForm } from './commentForm';
import type { Drawing } from './drawing';
import type { Application } from './app';
import type { ElementSelection } from './appTools/elementSelection';

export class Workspace {
  workspaceContainer: HTMLElement;
  projectName: string;
  projectId: string;
  permissions: gapi.client.drive.Permission[];
  projectIndex: number;
  drawings: Drawing[];
  elementsData: any; // TODO create interface
  drawingsStylesId: any; // TODO number or string?
  activeTool: ElementSelection;
  // toolSettings: any;
  appendedDrawingsIds: string[] = [];
  activeDrawing: Drawing;
  drawingsBtns: HTMLElement;
  drawingsStylesTag: HTMLStyleElement;
  saveBtn: HTMLElement;
  projectsData: any // ProjectData[]
  propsTablesContainer: HTMLElement;
  paramsTablesContainer: HTMLElement;
  commentsChangesUnsaved: boolean;
  commentsFileId: any; // string or number?
  comments: Comment[] = [];
  // Used to store arrays of all the comments that each element has, necessary when an element is clicked.
  elementsComments: any = {}; // TODO is an object but which type?
  pendingNotificationsToSend: any; // TODO is an array but of?
  mainPanel: MainPanel;
  commentForm: CommentForm;
  drawingsContainer: HTMLElement;

  constructor(projectData: any, App: Application) { // TODO use projectData instead
    // Create the workspace HTML container.
    this.workspaceContainer = document.createElement('div');
    this.workspaceContainer.classList.add('workspace');
    // TODO create viewport message as component. This element currently has id viewportMessage
    //this.viewportMessage = new ViewportMessage();    

    this.projectName = projectData.name;
    this.projectId = projectData.id;
    this.permissions = projectData.permissions;
    this.projectIndex = App.projectsData.findIndex((obj: any) => obj.name === projectData.name); // TODO use type projectData instead
    if (App.lastUploadedProject && projectData.id === App.lastUploadedProject.id) {
      //this.drawings = App.lastUploadedProject.drawings; // TODO when lastUploadedProject interface is avaiable uncomment it
      //this.drawingsStylesId = App.lastUploadedProject.drawingsStylesId;
      this.elementsData = App.lastUploadedProject.elementsData;
    } else {
      // Store the content of the drawings as entries name:'content'
      this.drawings = projectData.drawings;
      this.drawingsStylesId = projectData.drawingsStylesId;
      // TODO: Elements data could be changed to a similar system like the drawing objects.
      this.elementsData = {};
    }
    // Set title of the project in the button to list the projects.
    App.projectsListBtn.innerHTML = '<span>' + projectData.name + '</span>';
    this.drawingsBtns = App.drawingsBtns;
    this.saveBtn = App.saveBtn;
    this.createDrawingsBtns(this.drawings);
    // Show drawings and tools buttons.
    (this.drawingsBtns.children[0] as HTMLElement).innerText = 'Pick a drawing';
    this.drawingsBtns.style.display = 'unset';
    App.toolbarsContainer.style.display = 'flex';
    this.projectsData = App.projectsData;
    this.propsTablesContainer = document.getElementById('propsTablesContainer');
    this.paramsTablesContainer = document.getElementById('paramsTablesContainer');
    if (projectData.commentsFileId) {
      this.commentsFileId = projectData.commentsFileId;
    }
    if (projectData.comments) {
      projectData.comments.forEach((commentData: any) => {
        const commentObj = new Comment(commentData.elementsIds, commentData.content, commentData.mentions);
        this.comments.push(commentObj);
        for (let i = 0; i < commentData.elementsIds.length; i++) {
          if (!this.elementsComments.hasOwnProperty(commentData.elementsIds[i]))
            this.elementsComments[commentData.elementsIds[i]] = [];
          this.elementsComments[commentData.elementsIds[i]].push(commentObj.id);
        }
      });
      this.drawings.forEach(drawing => drawing.commentsChanged = true);
    }
    this.mainPanel = new MainPanel(App.panelsStorage, this);
    this.commentForm = new CommentForm(document.getElementById('commentForm') as HTMLFormElement, this);
    // Create and append the HTML drawings container.
    this.drawingsContainer = document.createElement('div');
    this.drawingsContainer.classList.add('drawingsContainer');
    this.workspaceContainer.appendChild(this.drawingsContainer);
    // Append the workspace container to the DOM.
    App.workspacesContainer.appendChild(this.workspaceContainer);
  }

  // TODO: Set a default 'activeDrawing' with the 'elementsData' tool active by default? this.activeTool = new ElementsData('elementsDataTool', this);


  /*********************** TOOLS MANAGEMENT ************************/

  /**
   * Sets the selected tool as active and turns off the previous one if still active.
   */
  manageTools(e: Event, Tool: typeof ElementSelection, name: string) {
    if (this.activeDrawing === undefined) {
      // TODO: Show a message saying that a drawing must be active.
      console.log('A drawing must be active.');
      return;
    }
    if (this.activeTool === undefined) {
      this.activeTool = new Tool(name, e.currentTarget as HTMLElement, this);
    } else if (this.activeTool.name !== name) {
      this.activeTool.kill();
      this.activeTool = new Tool(name, e.currentTarget as HTMLElement, this);
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
   */
  setDrawing(drawing: Drawing) {
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
          const elemsForCommentRepresentation: SVGGElement[] = [];
          for (let i = 0; i < this.comments[j].elementsIds.length; i++) {
            const element = drawing.content.querySelector('[data-id="' + this.comments[j].elementsIds[i] + '"]') as SVGGElement;
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
            this.comments[j].createRepresentation(drawing.commentsGroup, elemsForCommentRepresentation);
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
          const elemsForCommentRepresentation: SVGGElement[] = [];
          for (let i = 0; i < this.comments[j].elementsIds.length; i++) {
            const element = drawing.content.querySelector('[data-id="' + this.comments[j].elementsIds[i] + '"]') as SVGGElement;
            if (element !== null)
              elemsForCommentRepresentation.push(element);
          }
          if (elemsForCommentRepresentation.length > 0) {
            this.comments[j].createRepresentation(drawing.commentsGroup, elemsForCommentRepresentation);
          }
        }
        // TODO: Set visibility of the group.
      }
      // Set the commentsChanged property to false to indicate that it is updated.
      drawing.commentsChanged = false;
    }

    // TODO Could be removed because tool takes the active drawign from the workspace
    // Update the 'activeDrawing' in the 'activeTool'.
    // if (this.activeTool) {
    //   this.activeTool.activeDrawing = drawing;
    // }

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
  createDrawingsBtns(drawings: Drawing[]) {
    let drawingsItems: string[] = [];
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