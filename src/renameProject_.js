import API from './api';

export class RenameProject {
  constructor(renameProjectContainer, App) {
    this.htmlContainer = renameProjectContainer;
    this.renameForm = renameProjectContainer.querySelector('form');
    this.input = renameProjectContainer.querySelector('form > div:first-child > input');
    this.renameProjectErrorMsg = renameProjectContainer.querySelector('.error-msg');
    this.cancelBtn = renameProjectContainer.querySelector('form > div:last-child > .cancel-btn');

    // The App is needed to access some of its methods.
    this.app = App;

    this.projectListItem;

    this.projectId;
    this.currentName;

    this.emptyInputValue = new RegExp(/^(\s|\t)*$/);

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
    this.renameProjectErrorMsg.classList.add('hidden');
    this.setInputValue(this.currentName);
  }

  async renameProject(e) {
    e.preventDefault();
    if (this.input.value === '' || this.emptyInputValue.test(this.input.value)) {
      this.renameProjectErrorMsg.classList.remove('hidden');
    } else if (this.input.value.trim() === this.currentName) {
      this.setInputValue('');
      this.app.closeModalDialog();
    } else {
      this.renameProjectErrorMsg.classList.add('hidden');
      try {
        // TODO disable button while processing and maybe add waiting animation.
        const projectRenamedRes = await API.renameFile(this.projectId, this.input.value.trim());
        if (projectRenamedRes.status === 200) {
          this.projectListItem.querySelector('h4').innerText = projectRenamedRes.result.name;
          this.projectListItem.dataset.name = projectRenamedRes.result.name;
          this.setInputValue('');
          this.app.closeModalDialog();
          this.app.showMessage('success', 'Project renamed successfully.', 5000);
        } else {
          this.app.showMessage('error', 'It was not possible to rename the project.');
          this.app.closeModalDialog();
          console.error('Something went wrong renaming a project. ', projectRenamedRes);
        }
      } catch (err) {
        this.app.showMessage('error', 'It was not possible to rename the project.');
        this.app.closeModalDialog();
        console.error('Something went wrong renaming a project. ', err);
      }
    }
  }

  setInputValue(value) {
    this.input.value = value;
  }
}