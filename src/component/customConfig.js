require('jsrender')($);

export default class CustomConfig {
  constructor() {
    $.views.helpers("beta",()=>this.isBeta());
    $.views.helpers("ios",()=>this.isIOS());
  }
  
  isIOS(){
    return (navigator.platform.indexOf("iPhone") != -1) || 
    (navigator.platform.indexOf("iPad") != -1) || 
    (navigator.platform.indexOf("iPod") != -1);
  }

  isBeta(){
    return new URL(window.location.href).searchParams.get("beta")
  }
}