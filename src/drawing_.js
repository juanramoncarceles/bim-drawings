import Generics from './generics';

export class Drawing {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.content;

    this.svgCanvas;

    this.commentsGroup;

    this.commentsChanged;

    this.mousePosition;

    // Zoom
    this.SVGWIDTH = 500;
    this.ZOOMSPEED = 1.25;
    this._zoom = this._zoom.bind(this);

    // Pan
    this.allowPanning = false;
    this.svgInitialClick;
    this.prevViewBox;
  }

  setContent(content) {
    this.content = document.createElement('div');
    const domparser = new DOMParser();
    this.svgCanvas = domparser.parseFromString(content, 'image/svg+xml').documentElement;
    this.content.appendChild(this.svgCanvas);
    // Zoom
    this.svgCanvas.addEventListener('wheel', this._zoom);
    // Pan
    this.svgCanvas.addEventListener('mousedown', e => {
      if (e.buttons === 2) {
        this.allowPanning = true;
        this.svgInitialClick = Generics.getRelativeCoords(e, this.svgCanvas);
        this.prevViewBox = this.svgCanvas.viewBox.baseVal; // ViewBox value at start  
      }
    });
    this.svgCanvas.addEventListener('mouseup', () => this.allowPanning = false);
    this.svgCanvas.addEventListener('mouseleave', () => this.allowPanning = false);
    this.svgCanvas.addEventListener('mousemove', e => {
      if (e.buttons === 2 && this.allowPanning === false) {
        this.allowPanning = true;
        this.svgInitialClick = Generics.getRelativeCoords(e, this.svgCanvas);
        this.prevViewBox = this.svgCanvas.viewBox.baseVal; // ViewBox value at start
      }
      if (this.allowPanning) {
        this.mousePosition = Generics.getRelativeCoords(e, this.svgCanvas);
        this.svgCanvas.viewBox.baseVal.x = -this.mousePosition.x - (-this.svgInitialClick.x - this.prevViewBox.x);
        this.svgCanvas.viewBox.baseVal.y = -this.mousePosition.y - (-this.svgInitialClick.y - this.prevViewBox.y);
      }
    });
  }

  createCommentsGroup() {
    this.commentsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // group.setAttribute('comments', '');
    this.svgCanvas.appendChild(this.commentsGroup);
  }

  _zoom(e) {
    e.preventDefault();
    this.mousePosition = Generics.getRelativeCoords(e, this.svgCanvas);
    let zoomFactor = (e.deltaY > 0 ? this.ZOOMSPEED : 1 / this.ZOOMSPEED);
    let xProp = (this.mousePosition.x - this.svgCanvas.viewBox.baseVal.x) / this.svgCanvas.viewBox.baseVal.width;
    let xInc = this.svgCanvas.viewBox.baseVal.width * zoomFactor - this.svgCanvas.viewBox.baseVal.width;
    let yProp = (this.mousePosition.y - this.svgCanvas.viewBox.baseVal.y) / this.svgCanvas.viewBox.baseVal.height;
    let yInc = this.svgCanvas.viewBox.baseVal.height * zoomFactor - this.svgCanvas.viewBox.baseVal.height;
    if (e.deltaY > 0 ? this.svgCanvas.viewBox.baseVal.width < this.SVGWIDTH * 10 : this.svgCanvas.viewBox.baseVal.width > this.SVGWIDTH / 10) {
      this.svgCanvas.viewBox.baseVal.x -= xInc * xProp;
      this.svgCanvas.viewBox.baseVal.width += xInc;
      this.svgCanvas.viewBox.baseVal.y -= yInc * yProp;
      this.svgCanvas.viewBox.baseVal.height += yInc;
    }
  }
}