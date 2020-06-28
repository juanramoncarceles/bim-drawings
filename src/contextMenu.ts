import Generics from './generics';

interface HTMLElementWithContext extends HTMLElement {
  contextMenuData: ContextMenuData;
}

interface ContextMenuItem {
  name: string;
  action: (this: GlobalEventHandlers) => void;
}

interface ContextMenuData extends Array<ContextMenuItem>{}


export class ContextMenu {
  HTMLContainer: HTMLElement;
  menuListContainer: HTMLElement;
  visible = false;

  constructor() {
    this.HTMLContainer = document.createElement('div');
    this.HTMLContainer.id = 'contextMenu';
    this.menuListContainer = document.createElement('ul');
    this.HTMLContainer.appendChild(this.menuListContainer);
    this.HTMLContainer.style.display = 'none';
    window.addEventListener('click', () => {
      if (this.visible) this.toggleMenu('hide');
    });
    window.addEventListener('contextmenu', e => {
      e.preventDefault();
      const targetElement = (e.target as HTMLElement).closest('[data-cxmenu]') as HTMLElementWithContext;
      if (targetElement && targetElement.hasOwnProperty('contextMenuData')) {
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
   */
  toggleMenu(command: 'show' | 'hide') {
    this.HTMLContainer.style.display = command === "show" ? "block" : "none";
    this.visible = !this.visible;
  }

  /**
   * Sets the position of the context menu on the window.
   */
  setPosition(top: number, left: number) {
    this.HTMLContainer.style.left = `${left}px`;
    this.HTMLContainer.style.top = `${top}px`;
    this.toggleMenu("show");
  }

  /**
   * Removes the contents of the context menu as well as any associated event listener.
   */
  clearMenu() {
    this.menuListContainer.childNodes.forEach((btn: HTMLElement) => btn.onclick = null);
    Generics.emptyNode(this.menuListContainer);
  }  

  /**
   * Creates the contents of the context menu and appends them.
   */
  generateMenu(contextMenuData: ContextMenuData) {
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

