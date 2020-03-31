import { ElementSelection } from './elementSelection';
import { Comment } from './../comment';
import API from './../api';

export class AddComment extends ElementSelection {
  constructor(name, toolBtn, workspace) {
    super(name, toolBtn, workspace);
    console.log('Comment element tool enabled.');
    this.multipleSelection = true;
    this.boundingBox;
    this.waitingForComment = false; // TODO use this instead to avoid changing drawing?
    this.cancelComment = this.cancelComment.bind(this);
    workspace.commentForm.cancelCreateBtn.onclick = this.cancelComment;
    if (workspace.permissions.length > 1) { // There is always at least the owner.
      const membersEmails = [];
      const currentUserEmail = window.getCurrentUser().emailAddress;
      workspace.permissions.forEach(member => {
        if (member.emailAddress !== currentUserEmail) {
          membersEmails.push(`<option value="${member.emailAddress}">${member.displayName}</option>`);
        }
      });
      workspace.commentForm.mentionsInput.innerHTML = membersEmails.join('');
      workspace.commentForm.showMentionsSection();
    } else {
      workspace.commentForm.hideMentionsSection();
    }
    this.addComment = this.addComment.bind(this);
    workspace.commentForm.addCommentBtn.onclick = this.addComment;
    // It could be disabled and or full if the previous use was view mode.
    workspace.commentForm.enableForm();
    workspace.commentForm.reset();
    // This could be a property of the Tool class.
    this.hasUsedPanel = false;
  }


  /**
   * Extends the method of the super class to get the selected element.
   * @param {MouseEvent} e The click event.
   */
  manageSelection(e) {
    super.manageSelection(e);
    if (this.currentSelection.length > 0) {
      this.waitingForComment = true;
      // Show the form to add the comment.
      // TODO Open the panel when activating the tool instead.
      this.workspace.commentForm.buttonsVisibilityMode('create');
      this.workspace.mainPanel.addSection('Comment', this.workspace.commentForm.formElement);
      this.workspace.mainPanel.open();
      this.hasUsedPanel = true;
    } else {
      this.waitingForComment = false;
    }
  }


  addComment() {
    if (this.currentSelection.length === 0) return;
    // If 'activeDrawing' doesnt have a group for comments create it.
    if (this.workspace.activeDrawing.commentsGroup === undefined) {
      this.workspace.activeDrawing.createCommentsGroup();
    }
    // Mentions is only treated if there is more than one member in the team.
    let selectedEmails;
    if (this.workspace.permissions.length > 1) { // there is always at least the owner
      selectedEmails = this.workspace.commentForm.getSelectedMembers();
      if (selectedEmails.length > 0) {
        const currentUserName = window.getCurrentUser().displayName;
        const currentUserPhoto = window.getCurrentUser().photoLink;
        this.workspace.pendingNotificationsToSend.push({
          emails: selectedEmails,
          userName: currentUserName,
          userPhoto: currentUserPhoto,
          textContent: this.workspace.commentForm.textInput.value,
          projectName: this.workspace.projectName,
          projectId: this.workspace.projectId
        });
      }
    }
    const comment = new Comment(this.currentSelection, this.workspace.commentForm.textInput.value, selectedEmails);
    // Get references to the elements in the drawing to pass them
    const selElementsRef = this.getDrawingSelectedElementsRefs(this.workspace.activeDrawing);
    comment.createRepresentation(this.workspace.activeDrawing.commentsGroup, selElementsRef[0]); // TODO replace by the new method!!!
    // Add comment id to all the element arrays in the obj Workspace.elementsComments.
    for (let i = 0; i < this.currentSelection.length; i++) {
      if (!this.workspace.elementsComments.hasOwnProperty(this.currentSelection[i]))
        this.workspace.elementsComments[this.currentSelection[i]] = [];
      this.workspace.elementsComments[this.currentSelection[i]].push(comment.id);
    }
    console.log('elementsComments ', this.workspace.elementsComments);
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
    super.clearAllSelection();
  }


  cancelComment() {
    this.workspace.mainPanel.close();
    this.workspace.commentForm.reset();
    this.waitingForComment = false;
    super.clearAllSelection();
  }


  kill() {
    super.kill();
    console.log('Comment element tool disabled.');
    if (this.waitingForComment) {
      this.workspace.commentForm.reset();
      this.workspace.mainPanel.close();
    }
    if (this.hasUsedPanel) {
      this.workspace.mainPanel.removeSection('Comment');
    }
    // Remove the tool event listeners.
    this.workspace.commentForm.addCommentBtn.onclick = null;
    this.workspace.commentForm.cancelCreateBtn.onclick = null;
  }
}