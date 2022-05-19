import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModalInstallApp extends ModalBase {
  constructor(depts){
    super(depts);
    this.analytics = depts.analytics();
    this.custom = depts.analytics();
    this.appStoreLink = "https://apps.apple.com/app/chargeprice/id1552707493";
    this.playStoreLink = "https://play.google.com/store/apps/details?id=fr.chargeprice.app";
  }

  template(){
    return html`
    <div class="w3-modal-content">
      ${this.header(this.t("popupInstallHeader"))}
      <div class="w3-container w3-padding">
        <div>
          <a href="${this.appStoreLink}" target="_blank" @click="${()=>this.logClick("ios")}">
            <img src="img/store/app-store-badge.svg" width="240" class="w3-padding"/>
          </a>
        </div>
        <div>
          <a href="${this.playStoreLink}" target="_blank" @click="${()=>this.logClick("android")}">
            <img src="img/store/play-store-badge.png" width="240"/>
          </a>
        </div>
      </div>
    </div>
    `
  }

  show(){
    render(this.template(),this.getEl(this.root));
    this.getEl(this.root).style.display = 'block';
  }

  logClick(platform) {
    this.analytics.log('event', 'app_install_clicked',{platform: platform});
  }
 }

