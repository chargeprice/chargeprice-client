export default class Analytics {
  isAvailable(){
    return typeof(gtag) != "undefined";
  }

  log(){
    if(this.isAvailable()){
      gtag.apply(null,arguments);
    }
    else {
      console.log(JSON.stringify(Array.from(arguments)));
    }
  }

  consentGranted(){
    if(!this.isAvailable()) return;

    gtag('consent', 'update', {
      'analytics_storage': 'granted'
    });
  }
}