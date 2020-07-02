import { Tool } from './tool';
import type { Workspace } from '../workspace';
import type { Drawing } from '../drawing';
import { GeometryCalc } from '../geometry';
import generics from '../generics';

export class ElementSelection extends Tool {
  currentSelection: any = []; // TODO array of what? TODO This could be a property of the workspace?
  selection: SVGGElement; // TODO: Rename as clickedElement ?
  /**
   * Override this value to allow multiple selection on a tool. Default false.
   */
  multipleSelection = false;
  // TODO Set based on the window.devicePixelRatio ?
  maxPxOffsetToCheck = 3;

  constructor(name: string, toolBtn: HTMLElement, workspace: Workspace) {
    super(name, toolBtn, workspace);

    this.manageSelection = this.manageSelection.bind(this);
    workspace.drawingsContainer.addEventListener('click', this.manageSelection);
  }


  /********************* SELECTION OF ELEMENTS *********************/

  /**
   * Manages the selection and deselection of the svg elements.
   * This should be extended to obtain the selected element/s.
   * If multiple selection is required set the inherited field 'multipleSelection'
   * to true for example in the constructor of the extending class. Default is false.
   */
  manageSelection(e: MouseEvent) {
    this.selection = (e.target as SVGElement).closest('[selectable]');
    // If at first there is no selection start looking around from that point.
    if (!this.selection) {
      const coords = generics.getViewportRelativeCoords(e);
      outloop:
      for (let i = 1; i <= this.maxPxOffsetToCheck; i++) {
        const points = GeometryCalc.getPointsAround(coords, i);
        for (let j = 0; j < points.length; j++) {
          const el = document.elementFromPoint(points[j].x, points[j].y);
          if (el)
            this.selection = el.closest('[selectable]');
          if (this.selection) break outloop;
        }
      }
    }
    // If an element has been found.
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
   * @param element An SVG selectable element.
   */
  select(element: SVGGElement) {
    this.currentSelection.push(element.dataset.id);
    this.addSelectionAppearance(element);
  }

  /**
   * Deselects the specified element by removing it from the array of selected elements
   * and removing the selected appearance it has in the active drawing.
   * @param elementId An SVG selectable element.
   */
  deselect(elementId: string) {
    //const index = this.currentSelection.findIndex(el => el.dataset.id === element.dataset.id);
    const index = this.currentSelection.indexOf(elementId);
    if (index > -1) {
      this.currentSelection.splice(index, 1);
      const el = this.workspace.activeDrawing.content.querySelector('[data-id="' + elementId + '"]') as SVGGElement;
      if (el) this.clearSelectionAppearance(el);
    }
  }

  /**
   * Removes the selection appearance from any selected element in the provided drawing.
   * It does not remove its id from the array of selected elements. 
   */
  removeDrawingSelectionAppearance(drawing: Drawing) {
    for (let i = 0; i < this.currentSelection.length; i++) {
      const element = drawing.content.querySelector('[data-id="' + this.currentSelection[i] + '"]') as SVGGElement;
      if (element) this.clearSelectionAppearance(element);
    }
  }

  /**
   * Adds the selection appearance to any element in the array of selected elements that
   * is in the provided drawing.
   */
  addDrawingSelectionAppearance(drawing: Drawing) {
    for (let i = 0; i < this.currentSelection.length; i++) {
      const element = drawing.content.querySelector('[data-id="' + this.currentSelection[i] + '"]') as SVGGElement;
      if (element) this.addSelectionAppearance(element);
    }
  }

  /**
   * Removes the selected appearance of the provided element.
   * It does not removes the element from the array of selected elements.
   * @param element An SVG selectable element.
   */
  clearSelectionAppearance(element: SVGGElement) {
    for (let i = 0; i < element.children.length; i++)
      element.children[i].classList.remove('selected');
  }

  /**
   * Sets the appearance of the provided element as selected.
   * It does not add the element to the array of selected elements.
   * @param element An SVG selectable element.
   */
  addSelectionAppearance(element: SVGGElement) {
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
        const element = this.workspace.activeDrawing.content.querySelector('[data-id="' + this.currentSelection[i] + '"]') as SVGGElement;
        if (element) this.clearSelectionAppearance(element);
      }
      this.currentSelection.length = 0;
    }
  }

  /**
   * Gets an array of references of SVGGElements in the drawing that are currently selected.
   * Needed because not all selected elements may appear in a drawing. 
   */
  getDrawingSelectedElementsRefs(drawing: Drawing): SVGGElement[] {
    const selectedElements: SVGGElement[] = [];
    for (let i = 0; i < this.currentSelection.length; i++) {
      const element = drawing.content.querySelector('[data-id="' + this.currentSelection[i] + '"]') as SVGGElement;
      if (element) selectedElements.push(element);
    }
    return selectedElements;
  }

  kill() {
    super.kill();
    this.workspace.drawingsContainer.removeEventListener('click', this.manageSelection);
    this.clearAllSelection();
  }
}