import Generics from './generics';

export class ContextMenu {
  constructor() {
    this.HTMLContainer = document.createElement('div');
    this.HTMLContainer.id = 'contextMenu';
    this.menuListContainer = document.createElement('ul');
    this.HTMLContainer.appendChild(this.menuListContainer);
    this.HTMLContainer.style.display = 'none';
    this.visible = false;
    window.addEventListener('click', () => {
      if (this.visible) this.toggleMenu('hide');
    });
    window.addEventListener('contextmenu', e => {
      e.preventDefault();
      const targetElement = e.target.closest('[data-cxmenu]');
      if (targetElement && targetElement.contextMenuData) {
        // Clean previous content of the context menu.
        this.clearMenu();
        // Set the new content.
        this.generateMenu(targetElement.contextMenuData);
        // The position.
        this.setPosition(e.pageY, e.pageX);
      } else if (this.visible) {
        this.toggleMenu("hide");
      }
    });
    window.document.body.appendChild(this.HTMLContainer);
  }

  /**
   * Toggles the visibility of the context menu.
   * @param {string} command Values 'show' or 'hide'.
   */
  toggleMenu(command) {
    this.HTMLContainer.style.display = command === "show" ? "block" : "none";
    this.visible = !this.visible;
  }

  /**
   * Sets the position of the context menu on the window.
   * @param {number} top 
   * @param {number} left 
   */
  setPosition(top, left) {
    this.HTMLContainer.style.left = `${left}px`;
    this.HTMLContainer.style.top = `${top}px`;
    this.toggleMenu("show");
  }

  /**
   * Removes the contents of the context menu as well as any associated event listener.
   */
  clearMenu() {
    this.menuListContainer.childNodes.forEach(btn => btn.onclick = null);
    Generics.emptyNode(this.menuListContainer);
  }

  /**
   * Creates the contents of the context menu and appends them.
   * @param {ContextMenuData[]} contextMenuData Structure is an array of objects { name: '', action: function }
   */
  generateMenu(contextMenuData) {
    const itemsContainer = new DocumentFragment();
    for (let i = 0; i < contextMenuData.length; i++) {
      const item = document.createElement('li');
      item.innerText = contextMenuData[i].name;
      item.onclick = contextMenuData[i].action;
      itemsContainer.appendChild(item);
    }
    this.menuListContainer.appendChild(itemsContainer);
  }

}