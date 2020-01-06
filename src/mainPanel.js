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
      const button = e.target.closest('[data-btn]');
      if (button && !button.classList.contains('active'))
        this.setActive(button.innerText);
    };
    // Media breakpoint to determine the panel position.
    this.mediumBreakpoint = window.matchMedia('(max-width: 700px)');
    this.panelPositon = this.panelPositon.bind(this);
    this.mediumBreakpoint.addListener(this.panelPositon);
    this.panelPositon(this.mediumBreakpoint);
  }

  open() {
    this.panel.classList.add('open');
    this.panelPositon(this.mediumBreakpoint);
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
      this.panelBody.childNodes.forEach(content => {
        content.classList.remove('horizontal');
        content.classList.add('vertical');
      });
    } else if (side === 'bottom') {
      this.panel.classList.remove('right');
      this.panel.classList.add('bottom');
      this.panelBody.childNodes.forEach(content => {
        content.classList.remove('vertical');
        content.classList.add('horizontal');
      });
    }
  }

  /**
   * Sets a section as active.
   * @param {String} name The name of the section to activate.
   */
  setActive(name) {
    if (this.activeSection) {
      this.activeSection.button.classList.remove('active');
      this.activeSection.body.classList.add('hidden');
    }
    // This means that sections should have unique names.
    this.activeSection = this.sections.find(s => s.name === name);
    this.activeSection.button.classList.add('active');
    this.activeSection.body.classList.remove('hidden');
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
    this.setActive(section.name);
  }

  /**
   * Removes a section from the panel contents.
   * If this was the only section the panel will close.
   * @param {String} name 
   */
  removeSection(name) {
    const sectionIndex = this.sections.findIndex(s => s.name === name);
    if (sectionIndex >= 0) {
      const section = this.sections.splice(sectionIndex, 1)[0];
      section.button.remove();
      this.panelsStorage.appendChild(section.body);
      if (this.sections.length > 0) {
        // I set as active the first.
        this.setActive(this.sections[0].name);
      } else {
        this.close();
      }
    } else {
      console.warn('Impossible to remove the section. No section was found with that name.');
    }
  }

  panelPositon(breakpoint) {
    if (breakpoint.matches) {
      this.dockTo('bottom');
    } else {
      this.dockTo('right');
    }
  }

  kill() {
    //Remove event liseners
    this.panelHeader.onclick = null;
  }
}