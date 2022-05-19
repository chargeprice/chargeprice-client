import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModalDonate extends ModalBase {
  constructor(depts){
    super(depts);
    this.analytics = depts.analytics();
  }

  template(){
    return html`
    <div class="w3-modal-content">
      ${this.header(this.t("popupDonateHeader"))}
      <div class="w3-container w3-padding">
      <p>${this.t("popupDonateText")}</p>
      </div>
      <div class="w3-margin-bottom w3-margin-left">
        <a href="http://paypal.me/chargepricesupport" @click="${()=>this.donate()}">
          <img src="https://www.paypalobjects.com/${this.t('paypalLocale')}/i/btn/btn_donateCC_LG.gif"/>
        </a>
      </div>
      <br>
    </div>
    `
  }

  donate(){
    this.analytics.log('event', 'donate_clicked',{source: "popup"});
  }
}

