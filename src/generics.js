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
}
