import Generics from './generics';

export class Comment {
  constructor(elementsIds, content, mentions = []) {
    this.elementsIds = [];
    this.elementsIds.push(...elementsIds);
    this.content = content;
    this.id = 'c-' + Generics.uuidv4();
    this.representations = [];
    this.mentions = mentions;
  }

  /**
   * Creates an svg representation for the comment on the provided element and
   * adds it to the group of comment representations on the svg drawing.
   * @param {SVGGElement} commentsGroup
   * @param {SVGElement} element 
   */
  // createRepresentation(commentsGroup, element) {
  //   const representation = Generics.createBBox(element, 15, 15);
  //   // TODO: the style values will come from the app settings file if any.
  //   representation.setAttribute('style', 'fill:none;stroke:#e22a2a;stroke-width:8px;stroke-dasharray:18;');
  //   representation.dataset.id = this.id;
  //   commentsGroup.appendChild(representation);
  //   this.representations.push(representation);
  // }

  /**
   * Replaces the previous one
   * @param {SVGGElement} commentsGroup 
   * @param {Array of SVGGElement} elements 
   */
  createRepresentation(commentsGroup, elements) {
    // TODO new function
    const rectangles = [];
    for (let i = 0; i < elements.length; i++) {
      rectangles.push(Generics.createBBox2(elements[i], 15));
    }
    const segments = Generics.rectanglesSilhouette(rectangles);
    const representation = Generics.svgPathFromLines(segments);
    representation.setAttribute('style', 'fill:none;stroke:#e22a2a;stroke-width:8px;stroke-dasharray:30;stroke-linecap:round;');
    representation.dataset.id = this.id;
    commentsGroup.appendChild(representation);
    this.representations.push(representation);
  }




}