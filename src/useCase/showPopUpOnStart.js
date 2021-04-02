
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

    switch(previousStartCount){
      case 0: this.showWelcome(); break;
      case 2: this.showSocialMedia(); break;
      case 4: this.showAppInstall(); break;
      case 6: this.showDonate(); break;
    }
  }

  showWelcome(){
    if(this.didVisitBeforeWelcomeDialogExisted()) return;
    
    // consider redirect to car selection
    new ModalWelcome(this.depts).show();
  }

  showSocialMedia(){
    
    this.logPopUp("socialMedia");
    new ModalSocialMedia(this.depts).show();
  }

  showDonate(){
    this.logPopUp("donate");
    new ModalDonate(this.depts).show();
  }

  showAppInstall(){
    this.logPopUp("appInstall");
    new ModalInstallApp(this.depts).show();
  }

  didVisitBeforeWelcomeDialogExisted(){
    return !!localStorage.getItem("myVehicle");
  }

  logPopUp(name){
    this.analytics.log('send', 'event', 'Popup', name);
  }
}