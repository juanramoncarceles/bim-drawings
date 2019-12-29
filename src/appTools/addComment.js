import { ElementSelection } from './elementSelection';
import { Comment } from './../comment';
import API from './../api';

export class AddComment extends ElementSelection {
  constructor(name, toolBtn, workspace) {
    super(name, toolBtn, workspace);
    console.log('Comment element tool enabled.');
    this.boundingBox;
    this.waitingForComment = false;
    this.cancelCommentBtn = document.getElementById('commentFormCancel');
    this.cancelComment = this.cancelComment.bind(this);
    this.cancelCommentBtn.onclick = this.cancelComment;
    this.text = this.workspace.commentForm.elements["comment"];
    this.membersContainer = document.querySelector('#commentForm > .members');
    if (this.workspace.permissions.length > 1) { // there is always at least the owner
      this.membersSelection = this.workspace.commentForm.elements["members"];
      const membersEmails = [];
      this.workspace.permissions.forEach(member => {
        if (member.emailAddress !== 'ramoncarcelesroman@gmail.com') { // TODO: get the current with: window.getCurrentUser().emailAddress
          membersEmails.push(`<option value="${member.emailAddress}">${member.displayName}</option>`);
        }
      });
      this.membersSelection.innerHTML = membersEmails.join('');
      this.membersContainer.classList.remove('hidden');
    } else {
      this.membersContainer.classList.add('hidden');
    }
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
        // Show the form to add the comment.
        this.workspace.mainPanel.addSection('Comment', this.workspace.commentForm);
        this.workspace.mainPanel.open();
        // TODO: Allow to change the commented element by picking another one.
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
    // Mentions is only treated if there is more than one member in the team.
    const selectedEmails = [];
    if (this.workspace.permissions.length > 1) { // there is always at least the owner
      for (let i = 0; i < this.membersSelection.selectedOptions.length; i++) {
        selectedEmails.push(this.membersSelection.selectedOptions[i].value);
      }
      console.log(selectedEmails);
      if (selectedEmails.length > 0) {
        // TODO: window.getCurrentUser.displayName;
        // API.sendNotification(selectedEmails, 'Ramon' userInfo.displayName, userInfo.photoLink, this.text.value, this.workspace.projectName, this.workspace.projectId);
      }
    }
    const comment = new Comment(this.selection.dataset.id, this.text.value, selectedEmails);
    comment.createRepresentation(this.workspace.activeDrawing.commentsGroup, this.selection);
    // Add attribute to the commented element to indicate it has a comment.
    this.selection.dataset.comment = comment.id;
    this.workspace.comments.push(comment);
    console.log(this.workspace.comments);
    this.workspace.commentForm.reset();
    this.workspace.mainPanel.close();
    this.waitingForComment = false;
    // Workspace method to indicate that there are unsaved changes on comments.
    this.workspace.unsavedCommentsData();
    this.workspace.drawings.forEach(drawing => {
      if (drawing.id !== this.workspace.activeDrawing.id) {
        drawing.commentsChanged = true;
      }
    });
    super.clearSelection();
  }


  cancelComment(e) {
    e.preventDefault();
    this.workspace.mainPanel.close();
    this.workspace.commentForm.reset();
    this.waitingForComment = false;
    super.clearSelection();
  }


  kill() {
    super.kill();
    console.log('Comment element tool disabled.');
    if (this.waitingForComment) {
      this.workspace.commentForm.reset();
      // Close the panel.
      this.workspace.mainPanel.close();
    }
    // Remove the comment form.
    this.workspace.mainPanel.removeSection('Comment');
    // Remove the tool event listener.
    this.workspace.commentForm.onsubmit = null;
  }
}