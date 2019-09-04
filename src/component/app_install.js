require('jsrender')($);

export default class AppInstall {
  constructor(analytics) {
    this.analytics = analytics;
    this.registerEvent();
    this.installEvent = null;
    $("#btAppInstall").click(() => this.onInstall());
  }

  registerEvent(){
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.installEvent = e;
        this.showButton();
      });
    }
  }

  showButton(){
    $("#btAppInstall").show();
  }

  onInstall(){
    if(this.installEvent){
      this.installEvent.prompt();
      this.analytics.log('send', 'event', 'App', 'install');
    } 
  }
}

