import Generics from './generics';

export class Comments {
  constructor(name, workspace) {
    this.name = name;
    console.log('Comments tool activated!');
    this.drawingsContainer = workspace.drawingsContainer;
    // Consiste en añadir un event listener al conentedor de dibujos para controlar los clicks para crear dibujos? Seria parecido al manageSelection.
    this.createComment = this.createComment.bind(this);
    this.drawingsContainer.addEventListener('click', this.createComment);
    this.boundingBox;
    // this.waitingForComment;
    this.commentForm = workspace.commentForm;
    this.clickedElement;
    this.comments = workspace.comments;
    this.activeDrawing = workspace.activeDrawing;
    // Missing bind of this
    this.addComment = this.addComment.bind(this);
    this.commentForm.onsubmit = this.addComment;
  }


  createComment(e) {
    this.clickedElement = e.target.closest('[selectable]');
    if (this.clickedElement) {
      // if (!this.selectedElementId) {
      //   clickedElement.classList.add('selected');
      //   this.selectedElementId = clickedElement.dataset.id;
      // } else if (clickedElement.dataset.id !== this.selectedElementId) {
      //   if (this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]')) {
      //     this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]').classList.remove('selected');
      //   }
      //   clickedElement.classList.add('selected');
      //   this.selectedElementId = clickedElement.dataset.id;
      // }
      console.log('Add comment to: ', this.clickedElement);
      // Show the form to add the comment:
      this.commentForm.style.display = 'unset';
      // this.waitingForComment = true;
      // } else if (this.selectedElementId) {
      // if (this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]')) {
      //   this.activeDrawing.querySelector('[data-id="' + this.selectedElementId + '"]').classList.remove('selected');
      // }
      // this.selectedElementId = undefined;
    }
  }


  addComment(e) {
    e.preventDefault();
    // this.waitingForComment = false;
    // Creation of the bounding box.
    const boundingBox = Generics.createBBox(this.clickedElement);
    boundingBox.setAttribute('style', 'fill:none;stroke:#000;');
    // If 'activeDrawing' doesnt have a group for comments create it and add the bounding box. 
    if (this.activeDrawing.querySelector('g[comments]') !== null) {
      this.activeDrawing.querySelector('g[comments]').appendChild(boundingBox);
    } else {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('comments', '');
      group.appendChild(boundingBox);
      this.activeDrawing.querySelector('svg').appendChild(group);
    }
    this.comments.push({
      elementId: this.clickedElement.dataset.id,
      content: e.target.elements["comment"].value,
      uiComment: boundingBox
    });
    console.log(this.comments);
    e.target.elements["comment"].value = '';
    this.commentForm.style.display = 'none';
  }


  kill() {
    console.log('Tool killed!');
    // Remove the tool event listener
    this.drawingsContainer.removeEventListener('click', this.createComment);
    this.commentForm.onsubmit = null;
  }
}