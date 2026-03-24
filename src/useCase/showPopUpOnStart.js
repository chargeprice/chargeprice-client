
import ModalWelcome from '../modal/welcome';
import ModalPaywall from '../modal/paywall';
import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile';


export default class ShowPopUpOnStart {

  constructor(depts){
    this.depts = depts;
    this.translation = depts.translation();
    this.themeLoader = depts.themeLoader();
    this.analytics = depts.analytics();
    this.customConfig = depts.customConfig();
    this.settingsPrimitive = depts.settingsPrimitive();
  }

  async run(){
    this.settingsPrimitive.incrementAppStartCount();

    // don't show any paywall for white labels!
    if(!this.themeLoader.isDefaultTheme() || !this.customConfig.paywallEnabled()) 
    {
      if(!this.didAskForTracking()){
        this.showWelcome();
      }
      return;
    }
    
    if(!(await this.isLoggedIn())){
      this.showPaywall();
      return;
    }
  }

  showWelcome(){   
    new ModalWelcome(this.depts).show();
  }

  showPaywall(){
    new ModalPaywall(this.depts).show();
  }

  didAskForTracking(){
    return this.settingsPrimitive.getBoolean("askedForTracking",false);
  }

  logPopUp(name){
    this.analytics.log('event', 'app_start_popup',{popup_id: name});
  }

  async isLoggedIn(){
    if(this.profile) return true;

    try {
      const tokenWithProfile = await new FetchAccessTokenWithProfile(this.depts).run();
      this.profile = tokenWithProfile.profile;
    }
    catch(error){
      // Not logged in
    }

    return !!this.profile;
  }

}