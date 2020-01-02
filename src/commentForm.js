import Generics from './generics';

export class CommentForm {
  constructor(formElement, workspace) {
    this.formElement = formElement;
    this.workspace = workspace;
    formElement.onsubmit = e => { e.preventDefault() }
    this.cancelCreateBtn = document.getElementById('commentFormCancel');
    this.addCommentBtn = document.getElementById('addCommentBtn');
    this.deleteBtn = document.getElementById('commentFormDelete');
    this.deleteBtn.onclick = () => this.deleteComment(this.commentId);
    this.editBtn = document.getElementById('commentFormEdit');
    this.editBtn.onclick = () => this.enableEditComment(this.commentId);
    this.cancelUpdateBtn = document.getElementById('discardChanges');
    this.cancelUpdateBtn.onclick = () => this.discardUpdate();
    this.confirmUpdateBtn = document.getElementById('confirmChanges');
    this.textInput = formElement.elements["comment"];
    this.mentionsSection = formElement.querySelector('.members');
    this.mentionsInput = formElement.elements["members"];
    this.buttonsModes = formElement.querySelector('.formButtonsModes');
    this.commentId;
  }

  showMentionsSection() {
    this.mentionsSection.classList.remove('hidden');
  }

  hideMentionsSection() {
    this.mentionsSection.classList.add('hidden');
  }

  // TODO: here i can change other things like input labels?
  /**
   * Modes could be 'create', 'view', 'edit'
   * @param {String} mode 
   */
  buttonsVisibilityMode(mode) {
    for (let i = 0; i < this.buttonsModes.children.length; i++) {
      if (this.buttonsModes.children[i].dataset.mode !== mode) {
        this.buttonsModes.children[i].style.display = 'none';
      } else {
        this.buttonsModes.children[i].style.display = 'flex';
      }
    }
  }

  deleteComment(commentId) {
    const index = this.workspace.comments.findIndex(c => c.id === commentId);
    // Delete representations from the SVGs.
    this.workspace.comments[index].representations.forEach(r => r.remove());
    // Remove comment object from the array.
    this.workspace.comments.splice(index, 1);
    // Indicate that there are changes to save.
    this.workspace.unsavedCommentsData();

    // IMPORTANT this may ba wrong should be outside of this method
    // If it has been called from the panel then remove the Comment section ?? maybe not inside this function
    this.workspace.mainPanel.removeSection('Comment');
  }

  disableForm() {
    this.textInput.disabled = true;
    this.mentionsInput.disabled = true;
  }

  enableForm() {
    this.textInput.disabled = false;
    this.mentionsInput.disabled = false;
  }

  // TODO It makes more sense to pass the id
  viewComment(comment) {
    if (comment.id !== this.commentId) {
      this.fillInputs(comment);
      this.commentId = comment.id;
    }
    this.disableForm();
    this.buttonsVisibilityMode('view');
  }

  enableEditComment(commentId) {
    const comment = this.workspace.comments.find(c => c.id === commentId);
    if (!this.commentId || commentId !== this.commentId) {
      this.fillInputs(comment);
      this.commentId = commentId;
    }
    this.enableForm();
    this.buttonsVisibilityMode('edit');
    this.formElement.onchange = () => {
      this.confirmUpdateBtn.classList.remove('disabled');
      this.confirmUpdateBtn.onclick = () => this.updateComment(commentId, this.textInput.value, this.getSelectedMembers());
    }
  }

  updateComment(commentId, text, mentions) {
    const comment = this.workspace.comments.find(c => c.id === commentId);
    if (comment) {
      comment.content = text;
      comment.mentions = mentions;
      this.workspace.unsavedCommentsData();
      this.formElement.onchange = null;
      this.disableForm();
      this.buttonsVisibilityMode('view');
      this.confirmUpdateBtn.classList.add('disabled');
      this.cancelUpdateBtn.classList.add('disabled');
      this.confirmUpdateBtn.onclick = null;
      this.cancelUpdateBtn.onclick = null;
    } else {
      console.warn('No comment found with that id:', commentId);
    }
  }

  discardUpdate() {
    const comment = this.workspace.comments.find(c => c.id === this.commentId);
    if (comment) {
      this.textInput.value = comment.content;
      // TODO this.mentionsInput = '' if selection changed put initial selection
      this.formElement.onchange = null;
      this.disableForm();
      this.buttonsVisibilityMode('view');
      this.confirmUpdateBtn.classList.add('disabled');
      this.confirmUpdateBtn.onclick = null;
    } else {
      console.warn('No comment found with that id:', commentId);
    }
  }

  /**
   * Returns an array of the values of the selected options.
   */
  getSelectedMembers() {
    const selectedOptions = [];
    for (let i = 0; i < this.mentionsInput.selectedOptions.length; i++) {
      selectedOptions.push(this.mentionsInput.selectedOptions[i].value);
    }
    return selectedOptions;
  }

  fillInputs(comment) {
    this.textInput.value = comment.content;
    if (comment.mentions.length > 0) {
      const mentions = [];
      // It should be still a member of the team otherwise its name is set to 'removed user'
      // TODO: if a mentioned team member was removed it should be removed from any mention ? when ?
      // ? All members should be added here ?
      comment.mentions.forEach(mentionEmail => {
        const permission = this.workspace.permissions.find(p => p.emailAddress === mentionEmail);
        mentions.push(`<option value="${mentionEmail}">${permission ? permission.displayName : 'Removed user'}</option>`);
      });
      this.mentionsInput.innerHTML = mentions.join('');
    } else {
      // TODO Show a message indicating no mentions? show the empty select?
      Generics.emptyNode(this.mentionsInput);
    }
  }

  reset() {
    this.formElement.reset();
  }
}