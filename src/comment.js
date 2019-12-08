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
    const representation = Generics.createBBox(element, 10, 10);
    // TODO: the style values will come from the app settings file if any.
    representation.setAttribute('style', 'fill:none;stroke:#e22a2a;stroke-width:4px;stroke-dasharray:10;');
    representation.dataset.id = this.id;
    commentsGroup.appendChild(representation);
    this.representations.push(representation);
  }
}