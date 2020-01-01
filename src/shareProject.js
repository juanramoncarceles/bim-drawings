import API from './api';
import Generics from './generics';

export class ShareProject {
  constructor(shareProjectContainer, App) {
    this.htmlContainer = shareProjectContainer; // This is used in the context menu to pass it to the showModalDialog()
    this.shareForm = shareProjectContainer.querySelector('.share-form');
    this.shareFormErrorMsg = shareProjectContainer.querySelector('.share-form > .error-msg');
    this.confirmChangesBtns = shareProjectContainer.querySelector('.confirm-changes-btns');
    this.saveChangesBtn = shareProjectContainer.querySelector('.save-changes-btn');
    this.cancelChangesBtn = shareProjectContainer.querySelector('.cancel-changes-btn');
    this.waitingAnimation = shareProjectContainer.querySelector('.loader-container');
    this.currentUsersContent = shareProjectContainer.querySelector('.current-users');
    this.currentUsersTable = shareProjectContainer.querySelector('.current-users tbody');
    this.pendingUsersContent = shareProjectContainer.querySelector('.pending-users');
    this.pendingUsersToAddTable = shareProjectContainer.querySelector('.pending-users tbody');
    this.shareNotificationContainer = shareProjectContainer.querySelector('.share-notification');
    this.shareNotificationInput = shareProjectContainer.querySelector('.share-notification > input');

    // The App is needed to access some of its methods.
    this.app = App;

    // The App projectsList is needed to get the HTML item of the project to share.
    this.projectsList = App.projectsList;

    this.projectData;
    // Reference to the project HTML item element in the list.
    this.projectItem;

    // Array of permission ids (str) pending to delete for the current project.
    this.pendingToRemove = [];

    // Array of emails to share with.
    this.pendingToAdd = [];

    this.currentUsersTable.addEventListener('click', e => {
      if (e.target.closest('[data-action]')) {
        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn.dataset.action === 'stage') {
          this.stageMemberToRemove(actionBtn.parentElement);
        } else { // e.target.dataset.action === 'unstage'
          this.unstageMemberToRemove(actionBtn.parentElement);
        }
      }
    });

    this.pendingUsersToAddTable.addEventListener('click', e => {
      if (e.target.closest('[data-action]')) {
        this.unstageMemberToAdd(e.target.closest('[data-action]').parentElement);
      }
    });

    this.saveChanges = this.saveChanges.bind(this);

    this.stageMemberToAdd = this.stageMemberToAdd.bind(this);
    this.shareForm.onsubmit = this.stageMemberToAdd;
  }


  /**
   * When the modal dialog that contains this is open this method should be called.
   * @param {Object} projectData 
   */
  openDialog(projectData) {
    // Reset to an initial state. Maybe it is better to do this when the previous dialog is closed?
    this.pendingToRemove = [];
    Generics.emptyNode(this.currentUsersTable);
    this.pendingToAdd = [];
    Generics.emptyNode(this.pendingUsersToAddTable);
    this.pendingUsersContent.classList.add('hidden');
    this.shareNotificationContainer.classList.add('hidden');
    for (let i = 0; i < this.confirmChangesBtns.children.length; i++) {
      this.confirmChangesBtns.children[i].classList.add('disabled');
    }
    // Disable the manage changes buttons.
    this.saveChangesBtn.onclick = null;
    this.cancelChangesBtn.onclick = null;
    // Get the project info.
    this.projectData = projectData;
    this.projectItem = this.projectsList.querySelector('button[data-proj-id="' + projectData.id + '"]');
    // Create list of users if any.
    if (projectData.shared) {
      const users = [];
      const currentUserEmail = window.getCurrentUser().emailAddress;
      const owner = '<td title="Project owner"><svg><use href="#keyIcon"></use></svg></td>';
      const collab = '<td class="action-btn" data-action="stage"><svg><use href="#crossIcon"></use></svg></td>';
      projectData.permissions.forEach(user => {
        users.push(`
          <tr data-permission="${user.id}">
            <td class="user-data">
              <img src="${user.photoLink}">
              <div>
                <span>${user.emailAddress === currentUserEmail ? 'You' : user.displayName}</span>
                <span>${user.emailAddress}</span>
              </div>
            </td>
            ${user.role === 'owner' ? owner : collab}
          </tr>`);
      });
      this.currentUsersTable.innerHTML = users.join('');
      // Show the table because it could be hidden from the previous time.
      this.currentUsersContent.classList.remove('empty');
    } else {
      this.currentUsersContent.classList.add('empty');
    }
  }


  /**
   * Add a member email to the waiting list to be added as member.
   * @param {Event} e The submit event of the form to stage members to add.
   */
  stageMemberToAdd(e) {
    e.preventDefault();
    const emailAddress = e.target.elements['email'].value;
    if (emailAddress !== '' && !this.pendingToAdd.includes(emailAddress) && this.projectData.permissions.find(p => p.emailAddress === emailAddress) === undefined) {
      this.shareFormErrorMsg.classList.add('hidden');
      this.pendingToAdd.push(emailAddress);
      this.pendingUsersToAddTable.insertAdjacentHTML('beforeend', `
        <tr data-email="${emailAddress}">
          <td class="user-data"><span>${emailAddress}</span></td>
          <td class="action-btn" data-action="stage"><svg><use href="#crossIcon"></use></svg></td>
        </tr>`);
      e.target.elements['email'].value = '';
      // Actions when the first email is added to the table.
      if (this.pendingToAdd.length === 1) {
        this.pendingUsersContent.classList.remove('hidden');
        this.shareNotificationContainer.classList.remove('hidden');
        this.shareNotificationInput.checked = true;
        // If this makes that there are changes to save enable the buttons.
        if (this.pendingToRemove.length === 0) {
          for (let i = 0; i < this.confirmChangesBtns.children.length; i++) {
            this.confirmChangesBtns.children[i].classList.remove('disabled');
          }
          // Enable the manage changes buttons.
          this.saveChangesBtn.onclick = this.saveChanges;
          this.cancelChangesBtn.onclick = this.app.closeModalDialog;
        }
      }
    } else {
      this.shareFormErrorMsg.classList.remove('hidden');
      console.log('Not valid input.');
    }
  }


  /**
   * Removes from the staged state a member pending to be added.
   * @param {HTMLTableRowElement} element Table row HTML element with the data of the member to unstage. It should have a data attr with the email.
   */
  unstageMemberToAdd(element) {
    const itemIndex = this.pendingToAdd.indexOf(element.dataset.email);
    this.pendingToAdd.splice(itemIndex, 1);
    element.remove();
    // Actions when the table has become empty.
    if (this.pendingToAdd.length === 0) {
      this.pendingUsersContent.classList.add('hidden');
      this.shareNotificationContainer.classList.add('hidden');
      if (this.pendingToRemove.length === 0) {
        for (let i = 0; i < this.confirmChangesBtns.children.length; i++) {
          this.confirmChangesBtns.children[i].classList.add('disabled');
        }
        // Disable the manage changes buttons.
        this.saveChangesBtn.onclick = null;
        this.cancelChangesBtn.onclick = null;
      }
    }
  }


  /**
   * Adds a current member to the waiting list to be removed as member.
   * @param {HTMLTableRowElement} element Table row HTML element with the data of the member to delete. It should have a data attr with the permission id.
   */
  stageMemberToRemove(element) {
    this.pendingToRemove.push(element.dataset.permission);
    // Set the row element as pending to delete.
    element.classList.add('to-delete');
    // Change the row button action and icon.
    const actionBtn = element.querySelector('.action-btn');
    actionBtn.innerHTML = '<svg><use href="#reloadIcon"></use></svg>';
    actionBtn.dataset.action = "unstage";
    // If this makes that there are changes to save enable the 'confirm changes' buttons.
    if (this.pendingToAdd.length === 0 && this.pendingToRemove.length === 1) {
      for (let i = 0; i < this.confirmChangesBtns.children.length; i++) {
        this.confirmChangesBtns.children[i].classList.remove('disabled');
      }
      // Enable the manage changes buttons.
      this.saveChangesBtn.onclick = this.saveChanges;
      this.cancelChangesBtn.onclick = this.app.closeModalDialog;
    }
  }


  /**
   * Removes from the staged state a member pending to be removed.
   * @param {HTMLTableRowElement} element Table row HTML element with the data of the member to delete. It should have a data attr with the permission id.
   */
  unstageMemberToRemove(element) {
    // Remove the permission id from the array.
    const index = this.pendingToRemove.indexOf(element.dataset.permission);
    this.pendingToRemove.splice(index, 1);
    // Remove its to-delete class.
    element.classList.remove('to-delete');
    // Change the row button action and icon.
    const actionBtn = element.querySelector('.action-btn');
    actionBtn.innerHTML = '<svg><use href="#crossIcon"></use></svg>';
    actionBtn.dataset.action = "stage";
    // If this makes that there are no changes then disable the 'confirm changes' buttons.
    if (this.pendingToRemove.length === 0 && this.pendingToAdd.length === 0) {
      for (let i = 0; i < this.confirmChangesBtns.children.length; i++) {
        this.confirmChangesBtns.children[i].classList.add('disabled');
      }
      // Disable the manage changes buttons.
      this.saveChangesBtn.onclick = null;
      this.cancelChangesBtn.onclick = null;
    }
  }


  /**
   * Removes from the staged state all current members that were pending to be removed.
   */
  // TODO: Change to a reset method that cleans any staged member?
  // unstageAllMembersToRemove() {
  //   // Remove the pending to delte state from the row elements.
  //   this.pendingToRemove.forEach(element => {
  //     element.classList.remove('to-delete');
  //   });
  //   // Clear the staged users.
  //   this.pendingToRemove = [];
  //   // If this makes that there are no changes then disable the 'confirm changes' buttons.
  //   if (this.pendingToAdd.length === 0) {
  //     for (let i = 0; i < this.confirmChangesBtns.children.length; i++) {
  //       this.confirmChangesBtns.children[i].classList.add('disabled');
  //     }
  //     // TODO to disable the btns add the event listener or change a bool
  //   }
  // }


  /**
   * Adds all members that were in the pendingToAdd array to the team.
   */
  addStagedMembers() {
    const addMembersPromises = [];
    // Delay is required because GD API doesnt allow to create several permissions at the same time.
    const delay = 600;
    this.pendingToAdd.forEach((email, i) => {
      addMembersPromises.push(API.shareFile(this.projectData.id, email, delay * i));
    });
    return Promise.all(addMembersPromises);
  }


  /**
   * Removes all current members that were in the pendingToRemove array from the team.
   */
  removeStagedMembers() {
    const removeMembersPromises = [];
    this.pendingToRemove.forEach(permissionId => {
      removeMembersPromises.push(API.stopSharingFile(this.projectData.id, permissionId));
    });
    return Promise.all(removeMembersPromises);
  }


  /**
   * Save all the changes of addition and removal of members.
   */
  async saveChanges() {
    this.waitingAnimation.classList.remove('hidden');
    let additionSuccess = true;
    let removalSuccess = true;
    // Removal process.
    if (this.pendingToRemove.length > 0) {
      await this.removeStagedMembers().then(resArr => {
        // Remove the permissionIds also from the corresponding projectsData object.
        this.pendingToRemove.forEach(permissionId => {
          const index = this.projectData.permissions.findIndex(permission => permission.id === permissionId);
          this.projectData.permissions.splice(index, 1);
        });
      }, rej => {
        console.log(rej);
        removalSuccess = false;
      });
    }
    // Addition process.
    if (this.pendingToAdd.length > 0) {
      await this.addStagedMembers().then(resArr => {
        // 'resArr' is an array with all the resolved promises.
        resArr.forEach((res, i) => {
          this.projectData.permissions.push({
            id: res.result.id,
            emailAddress: this.pendingToAdd[i],
            role: res.result.role,
            displayName: res.result.displayName,
            thumb: res.result.photoLink
          });
        });
        if (this.shareNotificationInput.checked) {
          API.sendSharingProjectEmail(window.getCurrentUser().displayName, this.pendingToAdd, this.projectData.name, this.projectData.id);
        }
      }, rej => {
        console.log(rej);
        additionSuccess = false;
      });
    }
    // Actions depending on the success or failure.
    if (additionSuccess && removalSuccess) {
      if (this.projectData.permissions.length === 1) { // 1 because there is always at least the owner.
        this.projectData.shared = false;
        if (this.projectItem.querySelector('.sharedIcon')) {
          this.projectItem.querySelector('.sharedIcon').remove();
        }
      } else {
        this.projectData.shared = true;
        if (!this.projectItem.querySelector('.sharedIcon')) {
          this.projectItem.insertAdjacentHTML('afterbegin', '<img class="sharedIcon" src="src/assets/icons/shareIcon.svg">');
        }
      }
      this.app.showMessage('success', 'Project members updated successfully.', 5000);
    } else {
      this.app.showMessage('error', 'Something went wrong, member changes could no be saved.');
    }
    this.waitingAnimation.classList.add('hidden');
    this.app.closeModalDialog();
  }
}