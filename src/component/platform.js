require('jsrender')($);

export default class Platform {
  constructor() {
    $.views.helpers("ios",()=>this.isIOS());
  }
  
  isIOS(){
    return (navigator.platform.indexOf("iPhone") != -1) || 
    (navigator.platform.indexOf("iPad") != -1) || 
    (navigator.platform.indexOf("iPod") != -1);
  }
}