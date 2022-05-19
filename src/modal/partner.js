import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModelPartner extends ModalBase {
  constructor(depts){
    super(depts);
    this.analytics = depts.analytics();
  }

  template(){
    return html`
    <div class="w3-modal-content">
      ${this.header(this.t("partnerHeader"))}
      <div class="w3-container w3-padding">
        <p>
          <h3>Green Drive - Tesla Accessories</h3>
          <a @click="${()=>this.onAffiliatePartner("greendrive")}" href="https://www.greendrive-accessories.com/" target="_blank">
            <img width="100%" src="img/partners/greendrive.png">
          </a>
        </p>
        ${this.translation.currentLocaleOrFallback() == "fr" ? html`
        <p>
          <h3>High Drive - Découvrez le véhicule qui vous convient</h3>
          <a @click="${()=>this.onAffiliatePartner("high_drive")}" href="https://app.highdrive.fr/" target="_blank">
            <img width="100%" src="img/partners/high_drive.png">
          </a>
        </p>
        `:""}
      </div>
    </div>
    `
  }

  onAffiliatePartner(name){
    this.analytics.log('event', 'affiliate_partner',{partner: name});
  }
}

