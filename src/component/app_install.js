export default class AppInstall {
  registerServiceWorker(){
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  }
}

