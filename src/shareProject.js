import API from './api';

export class ShareProject {
  constructor(shareProjectContainer, App) {
    this.htmlContainer = shareProjectContainer;
    this.shareForm = shareProjectContainer.querySelector('.share-form');
    this.emailInput = document.getElementById('sharingEmail');
    this.removeUsersBtns = shareProjectContainer.querySelector('.remove-users-btns');
    this.saveChangesBtn = shareProjectContainer.querySelector('.save-changes-btn');
    this.cancelChangesBtn = shareProjectContainer.querySelector('.cancel-changes-btn');
    this.waitingAnimation = shareProjectContainer.querySelector('.loader-container');
    this.usersTable = shareProjectContainer.querySelector('.users-table > tbody');
    this.pendingUsersToAddTable = shareProjectContainer.querySelector('.pending-users-table > tbody');
    this.confirmShareBtn = shareProjectContainer.querySelector('.confirm-share-btn');

    // The App projectsList is needed to get the html item of the project to share.
    this.projectsList = App.projectsList;

    this.projectId;
    // Reference to the project item html element in the list.
    this.projectItem;

    // Array of referenced row elements to delete for the current project item.
    this.pendingToRemove = [];

    // Array of emails to share with.
    this.pendingToAdd = [];

    this.addMembers = this.addMembers.bind(this);
    this.confirmShareBtn.onclick = this.addMembers;

    this.removeMembers = this.removeMembers.bind(this);
    this.saveChangesBtn.onclick = this.removeMembers;

    this.unstageAllMembersToRemove = this.unstageAllMembersToRemove.bind(this);
    this.cancelChangesBtn.onclick = this.unstageAllMembersToRemove;

    this.usersTable.addEventListener('click', e => {
      if (e.target.closest('[data-delete]')) {
        this.stageMemberToRemove(e.target.closest('[data-delete]').parentElement);
      }
    });

    this.pendingUsersToAddTable.addEventListener('click', e => {
      if (e.target.closest('[data-delete]')) {
        this.unstageMemberToAdd(e.target.closest('[data-delete]').parentElement);
      }
    });

    this.stageMemberToAdd = this.stageMemberToAdd.bind(this);
    this.shareForm.onsubmit = this.stageMemberToAdd;
  }


  /**
   * When the modal dialog that contains this is open this method should be called.
   * @param {Object} projectData 
   */
  openDialog(projectData) {
    this.projectId = projectData.id;
    this.projectItem = this.projectsList.querySelector('button[data-proj-id="' + projectData.id + '"]');
    // Create list of users if any.
    if (projectData.shared) {
      const users = [];
      projectData.permissions.forEach(user => {
        if (user.role !== 'owner') {
          users.push(`
            <tr data-permission="${user.id}">
              <td class="user-data"><span>${user.displayName}</span><span>${user.emailAddress}</span></td>
              <td data-delete="">X</td>
            </tr>`);
        }
      });
      this.usersTable.innerHTML = users.join('');
    } else {
      this.usersTable.innerHTML = '<tr><td>No team members yet.</td></tr>';
    }
  }


  /**
   * Add a member email to the waiting list to be added as members.
   * @param {Event} e The submit event of the form to stage members to add.
   */
  stageMemberToAdd(e) {
    e.preventDefault();
    const emailAddress = e.target.elements['email'].value;
    if (emailAddress !== '') {
      this.pendingToAdd.push(emailAddress);
      this.pendingUsersToAddTable.insertAdjacentHTML('beforeend', `<tr data-email="${emailAddress}"><td><span>${emailAddress}</span></td><td data-delete="">X</td></tr>`);
      e.target.elements['email'].value = '';
    } else {
      console.log('Not valid input.');
    }
  }


  /**
   * Removes from the staged state a member pending to be added.
   * @param {HTMLTableRowElement} element Table row html element with the data of the member to unstage. It should have a data attr with the email.
   */
  unstageMemberToAdd(element) {
    const itemIndex = this.pendingToAdd.indexOf(element.dataset.email);
    this.pendingToAdd.splice(itemIndex, 1);
    element.remove();
  }


  /**
   * Adds a current member to the waiting list to be removed as member.
   * @param {HTMLTableRowElement} element Table row html element with the data of the member to delete. It should have a data attr with the permission id.
   */
  stageMemberToRemove(element) {
    this.pendingToRemove.push(element);
    console.log(this.pendingToRemove);
    // Hide the form to add users.
    this.shareForm.style.display = 'none';
    // Set the row element as pending to delete.
    element.classList.add('to-delete');
    // Show buttons to confirm or cancel the operation.
    this.removeUsersBtns.classList.remove('hidden');
  }

  /**
   * Removes from the staged state all current members that were pending to be removed.
   */
  unstageAllMembersToRemove() {
    // Remove the pending to delte state from the row elements.
    this.pendingToRemove.forEach(element => {
      element.classList.remove('to-delete');
    });
    // Clear the staged users.
    this.pendingToRemove = [];
    // Show form to add users.
    this.shareForm.style.display = 'unset';
    // Hide buttons to confirm or cancel the operation.
    this.removeUsersBtns.classList.add('hidden');
  }


  /**
   * Adds all members that were in the pendingToAdd array to the team.
   */
  addMembers() {
    // TODO Show waiting
    const addMembersPromises = [];
    this.pendingToAdd.forEach(email => {
      addMembersPromises.push(API.shareFile(this.projectId, email));
    });
    Promise.all(addMembersPromises).then(res => {
      console.log(res.body);
      // TODO Add the permissionIds to the corresponding projectsData
      // TODO Show message: Share successful or add email to the table in green for few seconds
      // TODO Add share icon to project item if it doesnt have yet
      // TODO Close dialog
      //this.waitingAnimation.classList.add('hidden');
    }, err => {

    });

  }

  /**
   * Removes all current members that were in the pendingToRemove array from the team.
   */
  removeMembers() {
    // TODO Show waiting
    const removeMembersPromises = [];
    this.pendingToRemove.forEach(member => {
      removeMembersPromises.push(API.stopSharingFile(this.projectId, member.dataset.permission));
    });
    Promise.all(removeMembersPromises).then(res => {
      console.log(res.body);
      // TODO Remove the permissionIds of the corresponding projectsData
      // TODO Show message: members removed successfully
      // TODO Remove share icon from the project item if there are no members.
      // TODO Close dialog

    }, err => {

    });
  }
}