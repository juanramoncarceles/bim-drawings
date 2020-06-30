import { Comment } from '../comment';

// Types for the json files with the elements data.

export interface ElementsDataFiles extends Array<CategoryElementDataFile>{}

interface CategoryElementDataFile {
  name: string;
  id: string;
}

// Types for the elements data objects.

export interface ModelElementsData {
  [category: string]: {
    instances: ElementsData;
    styles: ElementsData;
  };
}

interface ElementsData {
  [elementGuid: string]: ElementData;
}

export interface ElementData {
  properties: ElementDataEntry[];
  parameters: ElementDataEntry[];
}

export interface ElementDataEntry {
  name: string;
  value: any;
  category: string;
}

// The main type to store the data of a project.

export interface ProjectData {
  id: string;
  name: string;
  permissions: gapi.client.drive.Permission[];
  shared: boolean;
  thumbId: string;
  index: number;
  drawings: any; // TODO it is an object but which type? // TODO call this drawingsData since these are not Drawing objects
  elementsData: ElementsDataFiles;
  drawingsStylesId: string;
  commentsFileId: string;
  comments: Comment[];
}

// Notifications types

export interface NotificationToSend {
  emails: string[];
  userName: string;
  userPhoto: string;
  textContent: string;
  projectName: string;
  projectId: string;
}