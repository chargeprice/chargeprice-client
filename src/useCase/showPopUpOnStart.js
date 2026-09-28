
import ModalWelcome from '../modal/welcome';
import ModalPaywallEmc from '../modal/paywall_emc';
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

    // EMC theme has its own paywall
    if(this.themeLoader.getCurrentThemeId() === 'emc' && this.customConfig.paywallEnabled()){
      if(!(await this.isLoggedIn())){
        new ModalPaywallEmc(this.depts).show();
      }
      return;
    }

    // Premium features are restricted inside the app (PremiumGate), so everyone gets the welcome screen
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