import { Tool } from './tool';

export class ElementSelection extends Tool {
  constructor(name, toolBtn, workspace) {
    super(name, toolBtn, workspace);
    this.currentSelection; // TODO: This could be a property of the workspace?
    this.selection; // TODO: Rename as clickedElement ?
    this.manageSelection = this.manageSelection.bind(this);
    workspace.drawingsContainer.addEventListener('click', this.manageSelection);
  }


  /********************* SELECTION OF ELEMENTS *********************/

  /**
   * Manages the selection and deselection of the svg elements.
   * This should be extended to obtain the selected element.
   * @param {MouseEvent} e The click event.
   */
  manageSelection(e) {
    this.selection = e.target.closest('[selectable]');
    if (this.selection !== null) {
      if (this.currentSelection === undefined) {
        this.select(this.selection);
        this.currentSelection = this.selection;
      } else if (this.selection.dataset.id !== this.currentSelection.dataset.id) {
        if (this.workspace.activeDrawing.content.querySelector('[data-id="' + this.currentSelection.dataset.id + '"]')) {
          this.deselect(this.currentSelection);
        }
        this.select(this.selection);
        this.currentSelection = this.selection;
      }
    } else if (this.currentSelection !== undefined) {
      if (this.workspace.activeDrawing.content.querySelector('[data-id="' + this.currentSelection.dataset.id + '"]')) {
        this.deselect(this.currentSelection);
      }
      this.currentSelection = undefined;
    }
  }

  /**
   * Selects the specified element.
   * @param {SVGGElement} element An SVG selectable element.
   */
  select(element) {
    for (let i = 0; i < element.children.length; i++)
      element.children[i].classList.add('selected');
  }

  /**
   * Deselects the specified element.
   * @param {SVGGElement} element An SVG selectable element.
   */
  deselect(element) {
    for (let i = 0; i < element.children.length; i++)
      element.children[i].classList.remove('selected');
  }

  /**
   * Removes the selection from all selected elements in the workspace if any.
   */
  clearSelection() {
    if (this.currentSelection) {
      //this.currentSelection.classList.remove('selected');
      this.deselect(this.currentSelection);
      this.currentSelection = undefined;
    }
  }


  kill() {
    super.kill();
    this.workspace.drawingsContainer.removeEventListener('click', this.manageSelection);
    this.clearSelection();
  }
}