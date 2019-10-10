// TEST IDs
const testJSONresource = '1FdCYuqkHLdH4B9VHEN3wlMlTfm93frNT';
const testSVGresource = '1jP3929BWCMBqHIxohW8-WJxo6tRHJ5hM';
const testThumbImg = '1AEc5_qoinn01xQ5JZbx6TVXdMBksuC0e';
const mainAppFolderId = '1OHi3ynQoner7IPvmKhuraVNuD6zGLL12';


document.getElementById('uploadFileForm').onsubmit = e => {
  e.preventDefault();
  const file = e.target.elements["file"].files[0];
  createProject(file);
}

document.getElementById('list_files_btn').onclick = listFiles;

document.getElementById('read_file_btn').onclick = () => readFileContent('1jP3929BWCMBqHIxohW8-WJxo6tRHJ5hM');

document.getElementById('get_file_link_btn').onclick = () => getFileLink('1jP3929BWCMBqHIxohW8-WJxo6tRHJ5hM');

document.getElementById('create_folder_btn').onclick = () => createFolder('just', mainAppFolderId);


function readInputFile(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = () => {
      res(reader.result);
    }
    reader.onerror = () => {
      console.log("Error reading the file.");
    }
  });
}

function createTestAnchor() {
  const projectItemWrapper = document.createElement('a');
  projectItemWrapper.href = `secondPage.html?id=${encodeURIComponent(testSVGresource)}`;
  projectItemWrapper.innerText = 'Go to project';
  document.getElementById('projectItems').appendChild(projectItemWrapper);
}

createTestAnchor();

function startPage() {

  /* 
  Here instead would be a function to list the first 10 projects...
  TODO: After log in it will get the id of the app folder and fetch the name and thumb of each project inside.
  to create a list of project items   createProjectItems();
  */
  listFiles();

}