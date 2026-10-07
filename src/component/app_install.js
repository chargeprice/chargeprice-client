export default class AppInstall {
  // The web app used to work offline with a service worker, which served outdated versions
  // of the app. It's removed for all users who still have it installed.
  unregisterServiceWorker(){
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistrations().then(registrations=>{
      registrations.forEach(registration=>registration.unregister());
    });
    if (window.caches) {
      caches.keys().then(keys=>keys.forEach(key=>caches.delete(key)));
    }
  }
}
