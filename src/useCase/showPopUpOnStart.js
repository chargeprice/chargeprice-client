
import PlugcheckerToChargeprice from '../component/plugchecker_to_chargeprice.js';
import ModalSocialMedia from '../modal/socialMedia';
import ModalInstallApp from '../modal/installApp';
import ModalDonate from '../modal/donate';
import ModalWelcome from '../modal/welcome';

export default class ShowPopUpOnStart {

  constructor(depts){
    this.depts = depts;
    this.translation = depts.translation();
    this.customConfig = depts.customConfig();
    this.settingsPrimitive = depts.settingsPrimitive();
  }

  run(){
    if(new PlugcheckerToChargeprice(this.depts).tryShowDialog()) return;
    const previousStartCount = this.settingsPrimitive.getAppStartCount();
    this.settingsPrimitive.incrementAppStartCount();

    // don't show any pop ups for white labels!
    if(this.customConfig.isWhiteLabel()) return;

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
    new ModalSocialMedia(this.depts).show();
  }

  showDonate(){
    new ModalDonate(this.depts).show();
  }

  showAppInstall(){
    if(!this.customConfig.isMobileOrTablet() || this.customConfig.isRunningStandalone()) return;

    new ModalInstallApp(this.depts).show();
  }

  didVisitBeforeWelcomeDialogExisted(){
    return !!localStorage.getItem("myVehicle");
  }
}