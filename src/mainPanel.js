export class MainPanel {
  constructor(panel, panelsStorage) {
    this.panel = panel;
    this.panelsStorage = panelsStorage;
    this.panelHeader = this.panel.querySelector('.panel-header');
    this.panelBody = this.panel.querySelector('.panel-body');
    this.panelFooter = this.panel.querySelector('.panel-footer');
    this.activeSection;
    this.isOpen;
    this.sections = [];
    this.setActive = this.setActive.bind(this);
    this.panelHeader.addEventListener('click', this.setActive);
  }

  open() {
    this.panel.classList.add('open');
    this.isOpen = true;
  }

  close() {
    this.panel.classList.remove('open');
    this.isOpen = false;
  }

  /**
   * Docks the panel on the specified side.
   * @param {String} side Options: right or bottom.
   */
  dockTo(side) {
    if (side === 'right') {
      this.panel.classList.remove('bottom');
      this.panel.classList.add('right');
    } else if (side === 'bottom') {
      this.panel.classList.remove('right');
      this.panel.classList.add('bottom');
    }
  }

  setActive(e) {
    let button;
    if (e.target.closest('[data-btn]') || !button.classList.contains('active')) {
      button = e.target.closest('[data-btn]');
    } else {
      return;
    }
    if (this.activeSection) {
      this.activeSection.button.classList.remove('active');
      this.activeSection.body.style.display = 'none';
    }
    // This means that sections should have unique names.
    this.activeSection = this.sections.find(s => s.name === button.innerText);
    this.activeSection.button.classList.add('active');
    this.activeSection.body.style.display = 'unset';
  }

  /**
   * Adds a new section to the panel contents.
   * It can be used if
   * @param {String} name
   * @param {HMLTElement} body
   */
  addSection(name, body) {
    // The section button.
    const button = document.createElement('span');
    button.innerText = name;
    button.dataset.btn = '';
    // TODO: Set as the active? then if there is an active one it should be set as inactive?
    button.classList.add('active');
    this.panelHeader.appendChild(button);
    // The section body.
    //body.style.display = 'none';
    this.panelBody.appendChild(body);
    // Added to sections array.
    this.activeSection = { name, button, body }
    this.sections.push(this.activeSection);
    console.log('Panel sections:', this.sections);
  }

  /**
   * Removes a section form the panel contents.
   * @param {String} name 
   */
  removeSection(name) {
    const sectionIndex = this.sections.findIndex(s => s.name === name);
    const section = this.sections.splice(sectionIndex, 1)[0];
    section.button.remove();
    this.panelsStorage.appendChild(section.body);
    console.log('Panel sections:', this.sections);
  }

  //kill() {
  // Remove event liseners
  // Delete
  //}
}