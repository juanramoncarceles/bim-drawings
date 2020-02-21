export default class {

  /**
  * Read the content of a file.
  * @param {Blob} file 
  */
  static readInputFile(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = () => {
        res(reader.result);
      }
      reader.onerror = () => {
        console.log("Error reading the file.");
      }
    });
  }

  /**
  * Get the URL parameters.
  * Source: https://css-tricks.com/snippets/javascript/get-url-variables/
  * @param  {String} url The URL
  * @return {Object}     The URL parameters
  */
  static getUrlParams(url) {
    const params = {};
    const parser = document.createElement('a');
    parser.href = url;
    const vars = parser.search.substring(1).split('&');
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
  }

  /**
   * Removes all the childs of the HTML element.
   * @param {HTMLElement} node 
   */
  static emptyNode(node) {
    while (node.firstChild && node.removeChild(node.firstChild));
  }

  /**
   * Creates a fillet bounding box around the provided element.
   * @param {SVGElement} element 
   * @param {Number} offset Optional, with default 5.
   * @param {Number} fillet Optional, with default 5.
   */
  static createBBox(element, offset = 5, fillet = 5) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', element.getBBox().x - offset);
    rect.setAttribute('y', element.getBBox().y - offset);
    rect.setAttribute('width', element.getBBox().width + offset * 2);
    rect.setAttribute('height', element.getBBox().height + offset * 2);
    rect.setAttribute('rx', fillet);
    rect.setAttribute('ry', fillet);
    return rect;
  }

  /**
   * Function to get the coordinates of the mouse on the SVG canvas.
   * @param {MouseEvent} evt 
   * @param {SVGSVGElement} svgDoc 
   */
  static getRelativeCoords(evt, svgDoc) {
    const originPt = svgDoc.createSVGPoint();
    originPt.x = evt.clientX;
    originPt.y = evt.clientY;
    // The cursor point, translated into svg coordinates
    return originPt.matrixTransform(svgDoc.getScreenCTM().inverse());
  }

  // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  static uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
}