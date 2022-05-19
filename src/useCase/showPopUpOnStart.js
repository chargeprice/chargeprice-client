
import ModalSocialMedia from '../modal/socialMedia';
import ModalInstallApp from '../modal/installApp';
import ModalDonate from '../modal/donate';
import ModalWelcome from '../modal/welcome';

export default class ShowPopUpOnStart {

  constructor(depts){
    this.depts = depts;
    this.translation = depts.translation();
    this.themeLoader = depts.themeLoader();
    this.analytics = depts.analytics();
    this.customConfig = depts.customConfig();
    this.settingsPrimitive = depts.settingsPrimitive();
  }

  run(){
    const previousStartCount = this.settingsPrimitive.getAppStartCount();
    this.settingsPrimitive.incrementAppStartCount();

    // don't show any pop ups for white labels!
    if(!this.themeLoader.isDefaultTheme()) return;

    if(!this.didAskForTracking()){
      this.showWelcome();
      return;
    }

    switch(previousStartCount){
      case 2: this.showSocialMedia(); break;
      case 4: this.showAppInstall(); break;
      case 6: this.showDonate(); break;
    }
  }

  showWelcome(){   
    // consider redirect to car selection
    new ModalWelcome(this.depts).show();
  }

  showSocialMedia(){
    
    this.logPopUp("social_media");
    new ModalSocialMedia(this.depts).show();
  }

  showDonate(){
    this.logPopUp("donate");
    new ModalDonate(this.depts).show();
  }

  showAppInstall(){
    this.logPopUp("app_install");
    new ModalInstallApp(this.depts).show();
  }

  logPopUp(name){
    this.analytics.log('event', 'app_start_popup',{popup_id: name});
  }

  didAskForTracking(){
    return this.settingsPrimitive.getBoolean("askedForTracking",false);
  }

}