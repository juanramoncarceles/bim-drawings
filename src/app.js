export class Application {
  constructor() {
    this.projectsListBtn = document.getElementById('projectsListBtn');
    this.drawingsContainer = document.getElementById('drawingsContainer');
    this.drawingsBtns = document.getElementById('drawingsBtns');
    this.toolbarsContainer = document.getElementById('toolbarsContainer');
    this.modalDialogContainer = document.getElementById('modalDialogContainer');
    this.modalDialogsStorage = document.getElementById('modalDialogsStorage');
  }

  // All modal dialogs are stored in a container and fetched when needed.

  /**
  * Shows the modal dialog provided from the same document.
  * @param {HTMLElement} dialog Reference to the outer HTML element of the dialog.
  */
  showModalDialog(dialog) {
    this.modalDialogContainer.appendChild(dialog);
    this.modalDialogContainer.style.display = 'flex';
  }

  /**
  * Hides the modal dialog provided from the same document.
  * @param {HTMLElement} dialog Reference to the outer HTML element of the dialog.
  */
  closeModalDialog(dialog) {
    this.modalDialogContainer.style.display = 'none';
    this.modalDialogsStorage.appendChild(dialog);
  }
}