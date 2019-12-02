import { ElementSelection } from './elementSelection';
import { Comment } from './../comment';

export class AddComment extends ElementSelection {
  constructor(name, toolBtn, workspace) {
    super(name, toolBtn, workspace);
    console.log('Comment element tool enabled.');
    this.boundingBox;
    this.waitingForComment = false;
    this.input = this.workspace.commentForm.elements["comment"];
    this.addComment = this.addComment.bind(this);
    workspace.commentForm.onsubmit = this.addComment;
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


  addComment(e) {
    e.preventDefault();
    // If 'activeDrawing' doesnt have a group for comments create it.
    if (this.workspace.activeDrawing.commentsGroup === undefined) {
      this.workspace.activeDrawing.createCommentsGroup();
    }
    const comment = new Comment(this.selection.dataset.id, this.input.value);
    comment.createRepresentation(this.workspace.activeDrawing.commentsGroup, this.selection);
    this.workspace.comments.push(comment);
    console.log(this.workspace.comments);
    this.input.value = '';
    this.workspace.commentForm.style.display = 'none';
    this.waitingForComment = false;
    // Workspace method to indicate that there are unsaved changes on comments.
    this.workspace.unsavedCommentsData();
    this.workspace.drawings.forEach(drawing => {
      if (drawing.id !== this.workspace.activeDrawing.id) {
        drawing.commentsChanged = true;
      }
    });
    super.deselect();
  }


  kill() {
    super.kill();
    console.log('Comment element tool disabled.');
    if (this.waitingForComment) {
      this.workspace.commentForm.style.display = 'none';
      this.input.value = '';
    }
    // Remove the tool event listener.
    this.workspace.commentForm.onsubmit = null;
  }
}