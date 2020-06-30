import API from '../api';
import { ElementSelection } from './elementSelection';
import type { Workspace } from '../workspace';
import type { PanelSection } from '../mainPanel';
import { ElementDataEntry, ElementData, ModelElementsData, ProjectData } from '../types';

export class ShowElementData extends ElementSelection {
  elementsData: ModelElementsData;
  projectsData: ProjectData[];
  projectIndex: number;
  currentElementData: ElementData;
  // If a tool requires the panel it is specified here.
  // This could be a property of the Tool class.
  hasUsedPanel = false;

  constructor(name: string, toolBtn: HTMLElement, workspace: Workspace) {
    super(name, toolBtn, workspace);
    console.log('Elements data tool enabled.');
    this.elementsData = workspace.elementsData;
    this.projectsData = workspace.projectsData;
    this.projectIndex = workspace.projectIndex;
  }

  /**
   * Extends the method of the super class to get the selected element.
   */
  manageSelection(e: MouseEvent) {
    super.manageSelection(e);
    // Only if an element has been clicked and added, since it could have been removed.
    if (this.selection !== null && this.currentSelection.length > 0) {
      this.showElementData(this.selection.dataset.category, this.selection.dataset.id);
      if (this.selection.dataset.comment) {
        this.workspace.commentForm.viewComment(this.selection.dataset.comment);
        this.workspace.mainPanel.addSection('Comment', this.workspace.commentForm.formElement);
      } else if (this.workspace.mainPanel.sections.find(s => s.name === 'Comment')) {
        // If the comments section is there from the previous selected element it should be removed.
        this.workspace.mainPanel.removeSection('Comment');
      }
    } else if (this.currentElementData) {
      this.currentElementData = undefined;
      this.workspace.mainPanel.close();
      // TODO: Clean data tables content.
      console.log('Data table cleaned.');
    }
  }


  /******************** ELEMENTS ASSOCIATED DATA *******************/

  /**
   * Shows the data associated with the selected element by fetching it if needed.
   */
  async showElementData(category: string, id: string) {
    let success = true;
    if (this.elementsData[category]) {
      this.currentElementData = this.elementsData[category].instances[id];
      console.log(this.currentElementData);
    } else {
      const categoryData = this.projectsData[this.projectIndex].elementsData.find(obj => obj.name.replace('.json', '') === category);
      if (categoryData !== undefined) {
        // TODO: show a loader in the table.
        await API.getFileContent(categoryData.id).then(res => {
          this.elementsData[category] = JSON.parse(res.body);
          // TODO: hide the loader in the table.
          this.currentElementData = this.elementsData[category].instances[id];
          console.log(this.currentElementData);
        }, err => {
          // TODO: hide the loader in the table.
          success = false;
          // TODO: show error message.
          console.log(err);
        });
      } else {
        console.log('There is no data for that element.');
      }
    }
    if (success) {
      // Sets the contents on the properties and parameters panels.
      this.workspace.propsTablesContainer.innerHTML = this.createDataTable(this.currentElementData.properties);
      const sections: PanelSection[] = [{
        name: 'Properties',
        body: this.workspace.propsTablesContainer
      }];
      if (this.currentElementData.parameters.length > 0) {
        this.workspace.paramsTablesContainer.innerHTML = this.createDataTable(this.currentElementData.parameters);
        sections.push({
          name: 'Parameters',
          body: this.workspace.paramsTablesContainer
        });
      }
      this.workspace.mainPanel.addSections(sections);
      this.workspace.mainPanel.open();
      this.hasUsedPanel = true;
    }
  }


  /**
   * Creates various HTML tables with the data of the objects array.
   * Each object in the array should contain 'name', 'value' and 'category'.
   */
  createDataTable(dataEntries: ElementDataEntry[]) {
    const categoriesTitles: string[] = [];
    const dataByCategories: string[][] = [];
    for (let i = 0; i < dataEntries.length; i++) {
      const category = dataEntries[i].category;
      const categoryIndex = categoriesTitles.indexOf(category);
      const tableRow = `<tr><th>${dataEntries[i].name}</th><td>${dataEntries[i].value}</td></tr>`;
      if (categoryIndex !== -1) {
        dataByCategories[categoryIndex].push(tableRow);
      }
      else {
        dataByCategories.push([`<table class="data-table"><thead><tr><th colspan="2">${category}</th></tr></thead>`, tableRow]);
        categoriesTitles.push(category);
      }
    }
    const dataTable: string[] = [];
    for (let i = 0; i < dataByCategories.length; i++)
      dataTable.push(dataByCategories[i].join('') + '</tbody></table>');

    return dataTable.join('');
  }


  kill() {
    super.kill();
    // TODO: Clear the data table.
    // TODO: If the user has the option to anchor the panel this would be wrong.
    if (this.workspace.mainPanel.isOpen) {
      this.workspace.mainPanel.close();
    }
    if (this.hasUsedPanel) {
      this.workspace.mainPanel.removeSection('Properties');
      this.workspace.mainPanel.removeSection('Parameters');
      // TODO If it has used also the Comment section it should be removed.
    }
    console.log('Elements data tool disabled.');
  }
}