import Generics from '../generics';
import { ElementSelection } from './elementSelection';

export class AddComment extends ElementSelection {
  constructor(name, workspace) {
    super(name, workspace);
    console.log('Comments tool activated!');
    this.boundingBox;
    this.waitingForComment = false;
    this.input = this.workspace.commentForm.elements["comment"];
    this.addComment = this.addComment.bind(this);
    this.workspace.commentForm.onsubmit = this.addComment;
  }


  /**
   * Extends the method of the super class to get the selected element.
   * @param {MouseEvent} e The click event.
   */
  manageSelection(e) {
    if (!this.waitingForComment) {
      super.manageSelection(e);
      if (this.selection !== null) {
        console.log('Add comment to: ', this.selection);
        // Show the form to add the comment:
        this.workspace.commentForm.style.display = 'unset';
        this.waitingForComment = true;
      }
    }
  }


  /**
   * Creates a ui comment for the element and adds it to the group of comments on the drawing.
   * It doesnt append the comment svg element to the array of representations of the comment object.
   * @param {SVGElement} element 
   * @param {SVGGElement} commentsGroup
   */
  static createSvgComment(element, commentsGroup) {
    const boundingBox = Generics.createBBox(element);
    boundingBox.setAttribute('style', 'fill:none;stroke:#000;');
    boundingBox.dataset.id = 'c-' + element.dataset.id;
    commentsGroup.appendChild(boundingBox);
    return boundingBox;
  }


  addComment(e) {
    e.preventDefault();
    // If 'activeDrawing' doesnt have a group for comments create it.
    if (this.workspace.activeDrawing.commentsGroup === undefined) {
      this.workspace.activeDrawing.createCommentsGroup();
    }
    const uiComment = this.constructor.createSvgComment(this.selection, this.workspace.activeDrawing.commentsGroup);
    this.workspace.comments.push({
      id: uiComment.dataset.id,
      elementId: this.selection.dataset.id,
      content: this.input.value,
      uiElements: [uiComment]
    });
    console.log(this.workspace.comments);
    this.input.value = '';
    this.workspace.commentForm.style.display = 'none';
    this.waitingForComment = false;
    // Workspace method to indicate that there are unsaved changes.
    this.workspace.unsavedData();
    this.workspace.drawings.forEach(drawing => {
      if (drawing.id !== this.workspace.activeDrawing.id) {
        drawing.commentsChanged = true;
      }
    });
    super.deselect();
  }


  kill() {
    super.kill();
    console.log('Comment tool killed!');
    if (this.waitingForComment) {
      this.workspace.commentForm.style.display = 'none';
      this.input.value = '';
    }
    // Remove the tool event listener.
    this.workspace.commentForm.onsubmit = null;
  }
}