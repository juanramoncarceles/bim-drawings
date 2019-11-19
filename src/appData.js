export class ApplicationData {
  constructor() {
    this.appMainFolderId = undefined;
    this.projectsData = undefined; // Array of objects with data like name and id of the projects.
    this.appSettingsFolderId = undefined;
    this.thumbsFolderId = undefined;
    // The current workspace object will be stored here
    this.workspace = undefined;
  }
}