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
    this.panelHeader.onclick = e => {
      if (e.target.closest('[data-btn]') || !button.classList.contains('active'))
        this.setActive(e.target.closest('[data-btn]'));
    };
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

  /**
   * Sets a section as active.
   * @param {HTMLElement} button The button container that correspons to the section to activate.
   */
  setActive(button) {
    if (this.activeSection) {
      this.activeSection.button.classList.remove('active');
      this.activeSection.body.style.display = 'none';
    }
    // This means that sections should have unique names.
    this.activeSection = this.sections.find(s => s.name === button.innerText);
    this.activeSection.button.classList.add('active');
    // TODO: flex is needed for some cases but maybe not all.
    this.activeSection.body.style.display = 'flex';
  }

  /**
   * Adds a new section to the panel contents and sets it as active.
   * If a section with this name already exists then it is only activated.
   * @param {String} name
   * @param {HMLTElement} body
   */
  addSection(name, body) {
    let section = this.sections.find(s => s.name === name);
    if (section === undefined) {
      // The section button.
      const button = document.createElement('span');
      button.innerText = name;
      button.dataset.btn = '';
      this.panelHeader.appendChild(button);
      this.panelBody.appendChild(body);
      section = { name, button, body };
      // Added to sections array.
      this.sections.push(section);
    }
    this.setActive(section.button);
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

  kill() {
    //Remove event liseners
    this.panelHeader.onclick = null;
  }
}