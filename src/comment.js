import Generics from './generics';

export class Comment {
  constructor(elementId, content) {
    this.elementId = elementId,
      this.content = content,
      this.id = 'c-' + elementId,
      this.representations = []
  }

  /**
   * Creates an svg representation for the comment on the provided element and
   * adds it to the group of comment representations on the svg drawing.
   * @param {SVGGElement} commentsGroup
   * @param {SVGElement} element 
   */
  createRepresentation(commentsGroup, element) {
    const representation = Generics.createBBox(element);
    representation.setAttribute('style', 'fill:none;stroke:#000;');
    representation.dataset.id = this.id;
    commentsGroup.appendChild(representation);
    this.representations.push(representation);
  }
}