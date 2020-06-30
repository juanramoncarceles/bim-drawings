import Generics from './generics';

interface NotificationData {
  author: string;
  projectName: string;
  projectId: string;
  text: string;
  photoLink: string;
}

interface NotificationObject {
  id: string;
  representation: HTMLElement;
  state: 'pending' | 'read';
  data: NotificationData
}

export class NotificationsManager {
  notificationsBtn: HTMLElement;
  notificationsContainer: HTMLElement;
  notificationsList: HTMLElement;
  notifications: NotificationObject[] = [];

  constructor() {
    this.notificationsBtn = document.getElementById('notificationBtn');
    this.notificationsContainer = document.getElementById('notificationsContainer');
    this.notificationsList = document.querySelector('#notificationsContainer > .notifications-body');
    this.notificationsBtn.onclick = () => this.notificationsContainer.classList.toggle('open');
    this.notificationsList.addEventListener('click', e => {
      const element = (e.target as HTMLElement).closest('li');
      if (element) {
        this.viewNotification(element.dataset.id);
      }
    });
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
   */
  createNotificaction(data: NotificationData) {
    const notificationElement = document.createElement('li');
    const notificationId = Generics.uuidv4();
    notificationElement.dataset.id = notificationId;
    notificationElement.classList.add('pending');
    notificationElement.innerHTML = `
      <img class="notification-thumb" src="${data.photoLink}">
      <div class="notification-content">
        <h4>${data.author} mentioned you in a comment on the project ${data.projectName}</h4>
        <p>${data.text}</p>
      </div>`;
    this.notificationsList.prepend(notificationElement);
    this.notifications.push({ id: notificationId, representation: notificationElement, state: 'pending', data: data });
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
   */
  deleteNotificaction(notificationId: string) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    this.notifications[index].representation.remove();
    this.notifications.splice(index, 1);
    // TODO: If there are no more notifications then add the empty class to this.notificationsContainer
  }

  /**
   * TODO: separate goToNotification and markAsRead ?
   */
  viewNotification(notificationId: string) {
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
