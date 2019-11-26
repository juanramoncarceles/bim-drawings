import { AddComment } from './appTools/addComment';

export class Drawing {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.content;

    this.svgCanvas;

    this.commentsGroup;

    //this.zoomValue;
  }

  setContent(content) {
    this.content = document.createElement('div');
    const domparser = new DOMParser();
    this.svgCanvas = domparser.parseFromString(content, 'image/svg+xml').documentElement;
    this.content.appendChild(this.svgCanvas);
  }

  // Tratar la visibilidad por separado fuera de esta funcion?
  placeInDOM(drawingsContainer, comments) {
    this.content.style.visibility = 'hidden';
    // Important: It should be appened before crating comments,
    // otherwise those will not be created correctly.
    drawingsContainer.append(this.content);

    // TODO Esto esta mal? tendria que ir por separado?
    // Add the comments to the svg if there are any.
    if (comments.length > 0) {
      this.createCommentsGroup();
      // TODO: Set visibility
      // Append everything before creating the comments.
      this.createComments(comments);
    }
    this.content.style.visibility = 'unset';
  }


  createCommentsGroup() {
    this.commentsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // group.setAttribute('comments', '');
    this.svgCanvas.appendChild(this.commentsGroup);
  }

  /**
   * Creates all the comments for the drawing if the commented element exists.
   * To be used when still there is no group for comments or if it is empty
   * because it doesnt check if the element has already the comment.
   * @param {*} drawing svg
   * @param {*} commentsGroup 
   * @param {*} comments 
   */
  createComments(comments) { // Array of comment objects
    comments.forEach(comment => {
      if (this.svgCanvas.querySelector('[data-id="' + comment.elementId + '"]') !== null) {
        // Creation of the ui comment.
        const element = this.svgCanvas.querySelector('[data-id="' + comment.elementId + '"]');
        const uiComment = AddComment.createSvgComment(element, this.commentsGroup);
        comment.uiElements.push(uiComment);
      }
    });
  }

  //zoom() {

  //}

}