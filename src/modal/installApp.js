import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModalInstallApp extends ModalBase {
  constructor(depts){
    super(depts);
    this.analytics = depts.analytics();
    this.customConfig = depts.customConfig();
    this.custom = depts.analytics();
  }

  template(showInstall,isIOS){
    return html`
    <div class="w3-modal-content">
      ${this.header(this.t("popupInstallHeader"))}
      <div class="w3-container w3-padding">
        <p>${this.t("popupInstallText")}</p>
        <img src="img/graphics/app_icon_pinned.png" class="app-install-img">
      ${
        !showInstall ? html`
          <p>
            ${this.t("popupInstallTextPin")}
            ${
              isIOS ?
                html`
                <h3>${this.t("popupInstallTextPinStep")} 1</h3>
                <img src="img/graphics/ios_pin1.png" class="app-install-img">
                <h3>${this.t("popupInstallTextPinStep")} 2</h3>
                <img src="img/graphics/ios_pin2.png" class="app-install-img">
                ` : html`
                <h3>${this.t("popupInstallTextPinStep")} 1</h3>
                <img src="img/graphics/android_pin.png" class="app-install-img">
                <h3>${this.t("popupInstallTextPinStep")} 2</h3>
                "${this.t("popupInstallTextPinAndroid")}"
                `
            }
          </p>
          ` : ""
        }
      </div>
      ${
        showInstall ? html`
          <button @click="${()=>this.install()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
            <i class="fa fa-download"></i> ${this.t("popupInstallCTAInstall")}
          </button>
          ` : html`
          <button @click="${()=>this.hide()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
            ${this.t("ok")}
          </button>`
      }
    </div>
    `
  }

  show(){
    this.registerEvent();
    this.renderWith(false);
    this.getEl(this.root).style.display = 'block';
  }

  registerEvent(){
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
      console.log("register sw")
    
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log("beforeinstallprompt")

        e.preventDefault();
        this.installEvent = e;
        this.renderWith(true);
      });
    }
  }

  renderWith(showInstall){
    render(this.template(showInstall, this.customConfig.isIOS()),this.getEl(this.root));
  }

  install(){
    if(this.installEvent){
      this.installEvent.prompt();
      this.analytics.log('send', 'event', 'App', 'installPopUp');
    } 
    this.hide();
  }
}

