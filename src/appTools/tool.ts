import type { Workspace } from "../workspace";

export abstract class Tool {
  name: string;
  toolBtn: HTMLElement;
  workspace: Workspace;
  
  constructor(name: string, toolBtn: HTMLElement, workspace: Workspace) {
    this.name = name;
    this.toolBtn = toolBtn;
    this.workspace = workspace;
    this.toolBtn.classList.add('btn-tool-enabled');
  }

  kill() {
    this.toolBtn.classList.remove('btn-tool-enabled');
  }
}