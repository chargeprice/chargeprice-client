
import ModalWelcome from '../modal/welcome';


export default class ShowPopUpOnStart {

  constructor(depts){
    this.depts = depts;
    this.translation = depts.translation();
    this.themeLoader = depts.themeLoader();
    this.analytics = depts.analytics();
    this.settingsPrimitive = depts.settingsPrimitive();
  }

  async run(){
    this.settingsPrimitive.incrementAppStartCount();

    // Premium features are restricted inside the app (PremiumGate, for EMC its own paywall),
    // so everyone gets the welcome screen
    if(!this.didAskForTracking()){
      this.showWelcome();
    }
  }

  showWelcome(){   
    new ModalWelcome(this.depts).show();
  }

  didAskForTracking(){
    return this.settingsPrimitive.getBoolean("askedForTracking",false);
  }

  logPopUp(name){
    this.analytics.log('event', 'app_start_popup',{popup_id: name});
  }

}