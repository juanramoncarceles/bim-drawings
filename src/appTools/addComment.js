import Generics from '../generics';
import { ElementSelection } from './elementSelection';

export class AddComment extends ElementSelection {
  constructor(name, workspace) {
    super(name, workspace);
    console.log('Comments tool activated!');
    this.boundingBox;
    this.waitingForComment = false;
    this.commentForm = workspace.commentForm;
    this.input = commentForm.elements["comment"];
    this.comments = workspace.comments;
    this.activeDrawing = workspace.activeDrawing; // this is already in super
    this.addComment = this.addComment.bind(this);
    this.commentForm.onsubmit = this.addComment;
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
        this.commentForm.style.display = 'unset';
        this.waitingForComment = true;
      }
    }
  }


  addComment(e) {
    e.preventDefault();
    // Creation of the boundingbox.
    const boundingBox = Generics.createBBox(this.selection);
    boundingBox.setAttribute('style', 'fill:none;stroke:#000;');
    // If 'activeDrawing' doesnt have a group for comments create it and add the boundingbox. 
    if (this.activeDrawing.querySelector('g[comments]') !== null) {
      this.activeDrawing.querySelector('g[comments]').appendChild(boundingBox);
    } else {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('comments', '');
      group.appendChild(boundingBox);
      this.activeDrawing.querySelector('svg').appendChild(group);
    }
    this.comments.push({
      elementId: this.selection.dataset.id,
      content: this.input.value,
      uiComment: boundingBox
    });
    console.log(this.comments);
    this.input.value = '';
    this.commentForm.style.display = 'none';
    this.waitingForComment = false;
    super.deselect();
  }


  kill() {
    super.kill();
    console.log('Comment tool killed!');
    if (this.waitingForComment) {
      this.commentForm.style.display = 'none';
      this.input.value = '';
    }
    // Remove the tool event listener.
    this.commentForm.onsubmit = null;
  }
}