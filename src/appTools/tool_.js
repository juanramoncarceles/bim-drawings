export class Tool {
  constructor(name, toolBtn, workspace) {
    this.name = name;
    this.toolBtn = toolBtn;
    this.workspace = workspace;
    this.toolBtn.classList.add('btn-tool-enabled');
  }

  kill() {
    this.toolBtn.classList.remove('btn-tool-enabled');
  }
}