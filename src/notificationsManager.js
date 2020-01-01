import Generics from './generics';

export class NotificationsManager {
  constructor() {
    this.notificationsBtn = document.getElementById('notificationBtn');
    this.notificationsContainer = document.getElementById('notificationsContainer');
    this.notificationsList = document.querySelector('#notificationsContainer > .notifications-body');
    this.notificationsBtn.onclick = () => this.notificationsContainer.classList.toggle('open');
    this.notificationsList.addEventListener('click', e => {
      if (e.target.closest('li')) this.viewNotification(e.target.closest('li').dataset.id);
    });
    this.notifications = [];
  }

  // Show notifications panel
  // showNotificationsPanel() {

  // }

  // Hide notifications panel
  // hideNotificationsPanel() {

  // }


  /**
   * Creates a notification representation that appears in the UI and adds an object
   * with all the notification data to the notifications array.
   *   src/assets/avatar-placeholder.png
   * @param {Object} notificationObj It should have author, projectName, projectId, text and photoLink entries.
   */
  createNotificaction(notificationObj) {
    const notificationElement = document.createElement('li');
    const notificationId = Generics.uuidv4();
    notificationElement.dataset.id = notificationId;
    notificationElement.classList.add('pending');
    notificationElement.innerHTML = `
      <img class="notification-thumb" src="${notificationObj.photoLink}">
      <div class="notification-content">
        <h4>${notificationObj.author} mentioned you in a comment on the project ${notificationObj.projectName}</h4>
        <p>${notificationObj.text}</p>
      </div>`;
    this.notificationsList.prepend(notificationElement);
    this.notifications.push({ id: notificationId, representation: notificationElement, state: 'pending', data: notificationObj });
    // Enables the icon to indicate that there are pending notifications.
    // TODO: Dont do it each time.
    this.notificationsBtn.classList.add('enabled');
    if (this.notifications.length === 1) {
      this.notificationsContainer.classList.remove('empty');
    }
  }

  // Currently when a notification is visited it is removed
  // but it can be changed to keep them in history.

  /**
   * maximum of 10 read notifications or no limit if they are unread
   * @param {String} notificationId 
   */
  deleteNotificaction(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    this.notifications[index].representation.remove();
    this.notifications.splice(index, 1);
    // TODO: If there are no more notifications then add the empty class to this.notificationsContainer
  }

  /**
   * TODO: separate goToNotification and markAsRead ?
   * @param {String} notificationId 
   */
  viewNotification(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    notification.state = 'read';
    notification.representation.classList.remove('pending');
    // TODO: go to the notification, in a new tab? the project id is in notification.data.projectId
    // If there are no more pending notifications set the icon normal.
    if (this.notifications.find(n => n.state === 'pending') === undefined)
      this.notificationsBtn.classList.remove('enabled');
    // TODO: Delete notification or keep it in history ?
    // this.deleteNotificaction(notificationId);
  }

}
