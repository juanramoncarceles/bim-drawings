export class MainPanel {
  constructor(panelsStorage, Workspace) {
    this.panelsStorage = panelsStorage;

    // Creation of HTML structure.
    this.panelContainer = document.createElement('div');
    this.panelContainer.classList.add('mainPanel', 'right');
    this.panelGrip = document.createElement('div');
    this.panelGrip.classList.add('panel-grip');
    this.panelContainer.appendChild(this.panelGrip);
    this.panelContent = document.createElement('div');
    this.panelContent.classList.add('panel-content');
    this.panelHeader = document.createElement('div');
    this.panelHeader.classList.add('panel-header');
    this.panelBody = document.createElement('div');
    this.panelBody.classList.add('panel-body');
    this.panelFooter = document.createElement('div');
    this.panelFooter.classList.add('panel-footer');
    this.panelContent.appendChild(this.panelHeader);
    this.panelContent.appendChild(this.panelBody);
    this.panelContent.appendChild(this.panelFooter);
    this.panelContainer.appendChild(this.panelContent);


    // TODO Remove this event listeners when the panel is deleted.
    Workspace.workspaceContainer.addEventListener('mousemove', e => {
      if (this.resizingWidth) {
        this.resizeWidth(e);
      } else if (this.resizingHeight) {
        this.resizeHeight(e);
      }
    });
    Workspace.workspaceContainer.addEventListener('mouseup', () => { // Add also the same for mouseleave?
      this.resizingWidth = false;
      this.resizingHeight = false;
    });

    this.activeSection;
    this.isOpen;
    this.panelSide;
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
    this.panelSides = {
      right: 'r',
      bottom: 'b'
    }
    this.panelPositon(this.mediumBreakpoint);
    // Panel dimensions and resizing.
    this.panelWidth = 250;
    this.panelContainer.style.setProperty("--width", this.panelWidth + 'px');
    this.panelHeight = 200;
    this.panelContainer.style.setProperty("--height", this.panelHeight + 'px');
    this.resizingWidth = false;
    this.resizingHeight = false;
    this.startX;
    this.startWidth;
    this.startY;
    this.startHeight;
    this.panelGrip.onmousedown = e => {
      if (this.panelSide === this.panelSides.right) {
        this.resizingWidth = true;
        this.resizingHeight = false;
        this.startX = e.pageX;
        this.startWidth = this.panelWidth;
      } else if (this.panelSide === this.panelSides.bottom) {
        this.resizingHeight = true;
        this.resizingWidth = false;
        this.startY = e.pageY;
        this.startHeight = this.panelHeight;
      }
    };
    Workspace.workspaceContainer.appendChild(this.panelContainer);
  }

  resizeWidth(mouseEvent) {
    this.panelWidth = this.startWidth - (mouseEvent.pageX - this.startX);
    this.panelContainer.style.setProperty("--width", this.panelWidth + 'px');
  }

  resizeHeight(mouseEvent) {
    this.panelHeight = this.startHeight - (mouseEvent.pageY - this.startY);
    this.panelContainer.style.setProperty("--height", this.panelHeight + 'px');
  }

  open() {
    this.panelContainer.classList.add('open');
    this.panelPositon(this.mediumBreakpoint);
    this.isOpen = true;
  }

  close() {
    this.panelContainer.classList.remove('open');
    this.isOpen = false;
  }

  /**
   * Docks the panel on the specified side.
   * @param {Object field} side Use the MainPanel.panelsSides fields.
   */
  dockTo(side) {
    if (side === this.panelSides.right) {
      this.panelSide = side;
      this.panelContainer.classList.remove('bottom');
      this.panelContainer.classList.add('right');
      this.panelBody.childNodes.forEach(content => {
        content.classList.remove('horizontal');
        content.classList.add('vertical');
      });
    } else if (side === this.panelSides.bottom) {
      this.panelSide = side;
      this.panelContainer.classList.remove('right');
      this.panelContainer.classList.add('bottom');
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
    if (this.activeSection)
      this.setInactive(this.activeSection);
    // This means that sections should have unique names.
    this.activeSection = this.sections.find(s => s.name === name);
    this.activeSection.button.classList.add('active');
    this.activeSection.body.classList.remove('hidden');
  }

  /**
   * Sets a section as inactive, so in the back.
   * If there is only one and it is inactive the body wont be visible.
   * @param {Object} section Section object {name: string, button: SpanElement, body: HTMLElement }
   */
  setInactive(section) {
    section.button.classList.remove('active');
    section.body.classList.add('hidden');
  }

  /**
   * Adds a new section to the panel contents and sets it as active.
   * If a section with this name already exists then it is only activated.
   * @param {String} name
   * @param {HMLTElement} body
   * @param {Boolean} activate Set the section as active (the one visible). Default true.
   * @param {Boolean} first If true sets the section as the first one (left side). Default false.
   */
  addSection(name, body, activate = true, first = false) {
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
      if (first)
        this.sections.unshift(section);
      else
        this.sections.push(section);
    }
    if (activate)
      this.setActive(section.name);
    else
      this.setInactive(section);
  }

  /**
   * Adds a set of sections to the panel.
   * The first one in the array will be set as active.
   * @param {Array} sectionsArray Each object in the array should have a name and a body entry.
   */
  addSections(sectionsArray) {
    for (let i = 0; i < sectionsArray.length; i++) {
      this.addSection(sectionsArray[i].name, sectionsArray[i].body, i === 0 ? true : false)
    }
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
      this.dockTo(this.panelSides.bottom);
    } else {
      this.dockTo(this.panelSides.right);
    }
  }

  kill() {
    // Remove event liseners
    this.panelHeader.onclick = null;
    this.panelGrip.onmousedown = null;
  }
}