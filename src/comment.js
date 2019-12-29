import Generics from './generics';

export class Comment {
  constructor(elementId, content, mentions = []) {
    this.elementId = elementId;
    this.content = content;
    this.id = 'c-' + elementId;
    this.representations = [];
    this.mentions = mentions;
  }

  /**
   * Creates an svg representation for the comment on the provided element and
   * adds it to the group of comment representations on the svg drawing.
   * @param {SVGGElement} commentsGroup
   * @param {SVGElement} element 
   */
  createRepresentation(commentsGroup, element) {
    const representation = Generics.createBBox(element, 15, 15);
    // TODO: the style values will come from the app settings file if any.
    representation.setAttribute('style', 'fill:none;stroke:#e22a2a;stroke-width:8px;stroke-dasharray:18;');
    representation.dataset.id = this.id;
    commentsGroup.appendChild(representation);
    this.representations.push(representation);
    // Add a data-attr to the element to indicate it has an associated comment.
    element.dataset.comment = this.id;
  }
}