export class Drawing {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.content;

    this.svgCanvas;

    this.commentsGroup;

    this.commentsChanged;

    //this.zoomValue;
  }

  setContent(content) {
    this.content = document.createElement('div');
    const domparser = new DOMParser();
    this.svgCanvas = domparser.parseFromString(content, 'image/svg+xml').documentElement;
    this.content.appendChild(this.svgCanvas);
  }

  createCommentsGroup() {
    this.commentsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // group.setAttribute('comments', '');
    this.svgCanvas.appendChild(this.commentsGroup);
  }

  //zoom() {

  //}

}