import API from '../api';
import { ElementSelection } from './elementSelection';

export class ElementData extends ElementSelection {
  constructor(name, workspace) {
    super(name, workspace);
    console.log('Elements data tool activated!');
    this.elementsData = workspace.elementsData;
    this.projectsData = workspace.projectsData;
    this.projectIndex = workspace.projectIndex;
    this.currentElementData;
  }

  /**
   * Extends the method of the super class to get the selected element.
   * @param {MouseEvent} e The click event.
   */
  manageSelection(e) {
    super.manageSelection(e);
    if (this.selection !== null) {
      this.showElementData(this.selection.dataset.category, this.selection.dataset.id);
    } else if (this.currentElementData) {
      // TODO: Clean the data table.
      this.currentElementData = undefined;
      console.log('Clean the data table');
    }
  }


  /******************** ELEMENTS ASSOCIATED DATA *******************/

  /**
   * Shows the data associated with the selected element by fetching it if needed.
   * @param {String} category 
   * @param {String} id 
   */
  showElementData(category, id) {
    if (this.elementsData[category]) {
      this.currentElementData = this.elementsData[category].instances[id];
      console.log(this.currentElementData);
    } else {
      const categoryData = this.projectsData[this.projectIndex].elementsData.find(obj => obj.name.replace('.json', '') === category);
      if (categoryData !== undefined) {
        // TODO: show a loader in the table.
        API.getFileContent(categoryData.id).then(res => {
          this.elementsData[category] = JSON.parse(res.body);
          // TODO: hide the loader in the table.
          this.currentElementData = this.elementsData[category].instances[id];
          console.log(this.currentElementData);
        }, err => {
          // TODO: hide the loader in the table.
          console.log(err);
        });
      } else {
        console.log('There is no data for that element.');
      }
    }
  }


  kill() {
    super.kill();
    console.log('Elements data tool killed!');
    // TODO: Clear the data table.
  }
}