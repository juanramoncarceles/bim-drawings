/************************ PWA installation *************************/
// This content can be added to index.js

let deferredInstallPrompt = null;

const installButton = document.getElementById('installBtn');

installButton.addEventListener('click', installApp);


// Event listener for beforeinstallprompt event.
window.addEventListener('beforeinstallprompt', saveBeforeInstallPromptEvent);


/**
 * Event handler for beforeinstallprompt event.
 * Saves the event and shows install button.
 * @param {Event} e
 */
function saveBeforeInstallPromptEvent(e) {
  // Prevent from automatically showing the prompt which could happen
  // in some browsers and create a custom one.
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredInstallPrompt = e;
  // Update UI to notify the user they can add to home screen
  installButton.removeAttribute('hidden');
}


/**
 * Event handler for the install button.
 * @param {Event} e
 */
function installApp(e) {
  // Show install prompt.
  deferredInstallPrompt.prompt();
  // Hide the install button, it cant be called twice.
  e.srcElement.setAttribute('hidden', true);
  // Log user response to prompt.
  deferredInstallPrompt.userChoice
    .then(choice => {
      if (choice.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt', choice);
      } else {
        console.log('User dismissed the A2HS prompt', choice);
      }
      deferredInstallPrompt = null;
    });
}


// Add event listener for the appinstalled event.
// Since app can be installed in more than one way it is good to listen for this event.
window.addEventListener('appinstalled', logAppInstalled);


/**
 * The event handler for the appinstalled event.
 * @param {Event} e
 */
function logAppInstalled(e) {
  console.log('VisualARQ Drawings Viewer was installed.', e);
  // TODO: Log the installation for example to an analytics software or save the event somehow.
}