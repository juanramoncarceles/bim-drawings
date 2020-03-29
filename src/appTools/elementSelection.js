import { Tool } from './tool';

export class ElementSelection extends Tool {
  constructor(name, toolBtn, workspace) {
    super(name, toolBtn, workspace);
    this.currentSelection = []; // TODO This could be a property of the workspace?
    this.selection; // TODO: Rename as clickedElement ?
    /**
     * Override this value to allow multiple selection on a tool. Default false.
     */
    this.multipleSelection = false;
    this.manageSelection = this.manageSelection.bind(this);
    workspace.drawingsContainer.addEventListener('click', this.manageSelection);
  }


  /********************* SELECTION OF ELEMENTS *********************/

  /**
   * Manages the selection and deselection of the svg elements.
   * This should be extended to obtain the selected element/s.
   * If multiple selection is required set the inherited field 'multipleSelection'
   * to true for example in the constructor of the extending class. Default is false.
   * @param {MouseEvent} e The click event.
   */
  manageSelection(e) {
    this.selection = e.target.closest('[selectable]');
    if (this.selection !== null) {
      if (this.multipleSelection) {
        const index = this.currentSelection.indexOf(this.selection.dataset.id);
        if (index === -1) {
          this.select(this.selection);
        } else {
          this.deselect(this.selection.dataset.id);
        }
      } else {
        if (this.currentSelection.length === 0) {
          this.select(this.selection);
        } else if (this.selection.dataset.id !== this.currentSelection[0]) {
          this.deselect(this.currentSelection[0]);
          this.select(this.selection);
        } else if (this.selection.dataset.id === this.currentSelection[0]) {
          this.deselect(this.currentSelection[0]);
        }
      }
    } else {
      this.clearAllSelection();
    }
    console.log('Selection ', this.currentSelection);
  }

  /**
   * Selects the specified element by adding it to the array of selected
   * elements and setting its appearance as selected.
   * @param {SVGGElement} element An SVG selectable element.
   */
  select(element) {
    this.currentSelection.push(element.dataset.id);
    this.addSelectionAppearance(element);
  }

  /**
   * Deselects the specified element by removing it from the array of selected elements
   * and removing the selected appearance it has in the active drawing.
   * @param {String} elementId An SVG selectable element.
   */
  deselect(elementId) {
    //const index = this.currentSelection.findIndex(el => el.dataset.id === element.dataset.id);
    const index = this.currentSelection.indexOf(elementId);
    if (index > -1) {
      this.currentSelection.splice(index, 1);
      const el = this.workspace.activeDrawing.content.querySelector('[data-id="' + elementId + '"]');
      if (el) this.clearSelectionAppearance(el);
    }
  }

  /**
   * Removes the selection appearance from any selected element in the provided drawing.
   * It does not remove its id from the array of selected elements. 
   * @param {Drawing} drawing A drawing object.
   */
  removeDrawingSelectionAppearance(drawing) {
    for (let i = 0; i < this.currentSelection.length; i++) {
      const element = drawing.content.querySelector('[data-id="' + this.currentSelection[i] + '"]');
      if (element) this.clearSelectionAppearance(element);
    }
  }

  /**
   * Adds the selection appearance to any element in the array of selected elements that
   * is in the provided drawing.
   * @param {Drawing} drawing A drawing object.
   */
  addDrawingSelectionAppearance(drawing) {
    for (let i = 0; i < this.currentSelection.length; i++) {
      const element = drawing.content.querySelector('[data-id="' + this.currentSelection[i] + '"]');
      if (element) this.addSelectionAppearance(element);
    }
  }

  /**
   * Removes the selected appearance of the provided element.
   * It does not removes the element from the array of selected elements.
   * @param {SVGGElement} element An SVG selectable element.
   */
  clearSelectionAppearance(element) {
    for (let i = 0; i < element.children.length; i++)
      element.children[i].classList.remove('selected');
  }

  /**
   * Sets the appearance of the provided element as selected.
   * It does not add the element to the array of selected elements.
   * @param {SVGGElement} element An SVG selectable element.
   */
  addSelectionAppearance(element) {
    for (let i = 0; i < element.children.length; i++)
      element.children[i].classList.add('selected');
  }

  /**
   * Removes the selection from all the selected elements as well as the
   * selection appearance from all the selected elements in the active drawing.
   */
  clearAllSelection() {
    if (this.currentSelection.length > 0) {
      for (let i = 0; i < this.currentSelection.length; i++) {
        const element = this.workspace.activeDrawing.content.querySelector('[data-id="' + this.currentSelection[i] + '"]');
        if (element) this.clearSelectionAppearance(element);
      }
      this.currentSelection.length = 0;
    }
  }


  kill() {
    super.kill();
    this.workspace.drawingsContainer.removeEventListener('click', this.manageSelection);
    this.clearAllSelection();
  }
}