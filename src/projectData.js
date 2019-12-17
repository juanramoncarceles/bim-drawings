// TODO This is not being used.

export class ProjectData {
  constructor() {
    this.id = undefined;
    this.name = undefined;
    this.index = undefined; // Index in the appData.projectsData array
    this.drawings = {};
    this.elementsData = {};
    this.shared;
    this.permissions = []; // Array of objects with the permissions of users over the project folder.
    this.thumbId;
  }
}
