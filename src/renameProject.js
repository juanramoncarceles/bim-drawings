import API from './api';

export class RenameProject {
  constructor(renameProjectContainer, App) {
    this.htmlContainer = renameProjectContainer;
    this.renameForm = renameProjectContainer.querySelector('form');
    this.input = renameProjectContainer.querySelector('form > div:first-child > input');
    this.cancelBtn = renameProjectContainer.querySelector('form > div:last-child > .cancel-btn');

    // The App is needed to access some of its methods.
    this.app = App;

    this.projectListItem;

    this.projectId;
    this.currentName;

    this.renameProject = this.renameProject.bind(this);
    this.renameForm.onsubmit = this.renameProject;

    this.cancelBtn.onclick = e => {
      e.preventDefault();
      this.setInputValue('');
      App.closeModalDialog();
    }
  }

  /**
   * When the modal dialog that contains this is open this method should be called.
   * @param {HTMLElement} projectListItem 
   */
  setUpDialog(projectListItem) {
    this.projectListItem = projectListItem;
    this.projectId = projectListItem.dataset.projId;
    this.currentName = projectListItem.dataset.name;
    this.setInputValue(this.currentName);
  }

  async renameProject(e) {
    e.preventDefault();
    if (this.input.value === '') { // TODO neither blank space
      console.log('Input cannot be empty.');
    } else if (this.input.value === this.currentName) {
      this.setInputValue('');
      this.app.closeModalDialog();
    } else {
      const projectRenamedRes = await API.renameFile(this.projectId, this.input.value);
      if (projectRenamedRes.status === 200) {
        this.projectListItem.querySelector('h4').innerText = this.input.value;
        this.projectListItem.dataset.name = this.input.value;
        this.setInputValue('');
        this.app.closeModalDialog();
        this.app.showMessage('success', 'Project renamed successfully.', 3000);
      } else {
        this.app.showMessage('error', 'It was not possible to rename the project.');
        console.error('Something went wrong renaming a project. ', projectRenamedRes);
      }
    }
  }

  setInputValue(value) {
    this.input.value = value;
  }
}