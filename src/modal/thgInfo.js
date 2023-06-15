import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModelThgInfo extends ModalBase {
  constructor(depts){
    super(depts);
    this.analytics = depts.analytics();
    this.settingsPrimitive = depts.settingsPrimitive();

    this.countryLinks = {
      "DE": "https://geld-fuer-eauto.de/ref/chargeprice",
      "AT": "https://www.awin1.com/cread.php?awinmid=34001&awinaffid=1352881&ued=https%3A%2F%2Fthg.insta-drive.com%2Fat%2F"
    }
  }

  template(){
    return html`
    <div class="w3-modal-content">
      ${this.header(this.t("thgHeader"))}
      <div class="w3-container w3-padding">
        <p>${this.ut("thgInfo")}</p>
      </div>
      <div class="w3-container w3-padding w3-center">
        <button @click="${()=>this.open()}" class="w3-btn pc-secondary">
          ${this.t("thgCTA")}
        </button>
      </div>
      <div class="w3-container w3-padding w3-center">
        <span @click="${()=>this.noThanks()}" class="link-text w3-small w3-grey-text">${this.t("thgHide")}</span>
      </div>
      
    </div>
    `
  }

  show(country){
    this.country = country;
    render(this.template(),this.getEl(this.root));
    this.getEl(this.root).style.display = 'block';
  }

  open(){
    this.analytics.log('event', 'thg_redirect',{ country: this.country });
    window.open(this.countryLinks[this.country], '_self');
    this.hide();
  }

  noThanks(){
    this.analytics.log('event', 'thg_hide',{ country: this.country });

    this.settingsPrimitive.setBoolean("thgBannerHidden",true);
    this.hide();
  }
}

