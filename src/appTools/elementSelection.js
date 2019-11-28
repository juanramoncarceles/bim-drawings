export class ElementSelection {
  constructor(name, workspace) {
    this.name = name;
    this.workspace = workspace;
    this.currentSelection;
    this.selection; // TODO: Rename as clickedElement ?
    this.manageSelection = this.manageSelection.bind(this);
    this.workspace.drawingsContainer.addEventListener('click', this.manageSelection);
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
        this.selection.classList.add('selected');
        this.currentSelection = this.selection;
      } else if (this.selection.dataset.id !== this.currentSelection.dataset.id) {
        if (this.workspace.activeDrawing.querySelector('[data-id="' + this.currentSelection.dataset.id + '"]')) {
          this.currentSelection.classList.remove('selected');
        }
        this.selection.classList.add('selected');
        this.currentSelection = this.selection;
      }
    } else if (this.currentSelection !== undefined) {
      if (this.workspace.activeDrawing.querySelector('[data-id="' + this.currentSelection.dataset.id + '"]')) {
        this.currentSelection.classList.remove('selected');
      }
      this.currentSelection = undefined;
    }
  }


  deselect() {
    if (this.currentSelection) {
      this.currentSelection.classList.remove('selected');
      this.currentSelection = undefined;
    }
  }


  kill() {
    this.workspace.drawingsContainer.removeEventListener('click', this.manageSelection);
    this.deselect();
  }
}