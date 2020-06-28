// TODO This is not being used.

export class ProjectDataX {

  constructor(id: string, name: string, index: number) {
    //this.id = undefined;
    //this.name = undefined;
    //this.index = undefined; // Index in the appData.projectsData array
    //this.drawings = {}; // TODO call this drawingsData since these are not Drawing objects
    //this.elementsData = {};
    //this.shared;
    //this.permissions = []; // Array of objects with the permissions of users over the project folder.
    //this.thumbId;
  }
}

export interface ProjectData {
  id: string;
  name: string;
  index: number;
  drawings: any; // TODO it is an object but which type? // TODO call this drawingsData since these are not Drawing objects
  elementsData: any; // TODO it is an object
  shared: boolean;
  permissions: gapi.client.drive.Permission[];
  thumbId: string;
}