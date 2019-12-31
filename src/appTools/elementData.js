import API from '../api';
import { ElementSelection } from './elementSelection';

export class ElementData extends ElementSelection {
  constructor(name, toolBtn, workspace) {
    super(name, toolBtn, workspace);
    console.log('Elements data tool enabled.');
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
      if (this.selection.dataset.comment) {
        const comment = this.workspace.comments.find(c => c.id === this.selection.dataset.comment);
        this.workspace.commentForm.viewComment(comment);
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
   * @param {String} category 
   * @param {String} id 
   */
  async showElementData(category, id) {
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
      // Sets the content on the data tables container.
      this.workspace.dataTablesContainer.innerHTML = this.createDataTable(this.currentElementData);
      this.workspace.mainPanel.addSection('Properties', this.workspace.dataTablesContainer);
      this.workspace.mainPanel.open();
    }
  }


  /**
   * Creates various HTML tables with the data of the provided object.
   * It access two levels of the object, first as titles and second as key value pairs.
   * @param {Object} data 
   */
  createDataTable(data) {
    const dataTable = [];
    for (const title in data) {
      dataTable.push('<table class="data-table"><thead><tr><th colspan="2">' + title + '</th></tr></thead>');
      dataTable.push('<tbody>');
      for (const field in data[title]) {
        dataTable.push('<tr>');
        dataTable.push('<th>' + field + '</th>');
        dataTable.push('<td>' + data[title][field] + '</td>');
        dataTable.push('</tr>');
      }
      dataTable.push('</tbody></table>');
    }
    dataTable.push('</table>');
    return dataTable.join('');
  }


  kill() {
    super.kill();
    // TODO: Clear the data table.
    if (this.workspace.mainPanel.isOpen) {
      this.workspace.mainPanel.close();
      this.workspace.mainPanel.removeSection('Properties');
    }
    console.log('Elements data tool disabled.');
  }
}