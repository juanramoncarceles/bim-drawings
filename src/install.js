/////////////////////// PWA installation ///////////////////////

'use strict';

let deferredInstallPrompt = null;
const installButton = document.getElementById('installBtn');
installButton.addEventListener('click', installPWA);


// Event listener for beforeinstallprompt event.
window.addEventListener('beforeinstallprompt', saveBeforeInstallPromptEvent);


/**
 * Event handler for beforeinstallprompt event.
 * Saves the event and shows install button.
 * @param {Event} evt
 */
function saveBeforeInstallPromptEvent(evt) {
  deferredInstallPrompt = evt;
  installButton.removeAttribute('hidden');
}


/**
 * Event handler for install button. *
 * @param {Event} evt
 */
function installPWA(evt) {
  // Show install prompt.
  deferredInstallPrompt.prompt();
  // Hide the install button, it can't be called twice.
  evt.srcElement.setAttribute('hidden', true);
  // Log user response to prompt.
  deferredInstallPrompt.userChoice
    .then((choice) => {
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
 * @param {Event} evt
 */
function logAppInstalled(evt) {
  console.log('VisualARQ Drawings Viewer was installed.', evt);
  // TODO: Log the installation for example to an analytics software or save the event somehow.
}