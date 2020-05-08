import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModalSocialMedia extends ModalBase {
  constructor(depts){
    super(depts);
    this.analytics = depts.analytics();
  }

  template(){
    return html`
    <div class="w3-modal-content">
      ${this.header(this.t("popupSocialMediaHeader"))}
      <div class="w3-container w3-padding">
      <p>${this.t("popupSocialMediaText1")}</p>
      <p>${this.t("popupSocialMediaText2")}</p>
      </div>
      <button @click="${()=>this.open("facebook")}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
        <i class="fa fa-facebook"></i> Facebook
      </button>
      <button @click="${()=>this.open("twitter")}" class="w3-btn pc-secondary w3-margin-bottom">
        <i class="fa fa-twitter"></i> Twitter
      </button>
      <button @click="${()=>this.open("linkedin")}" class="w3-btn pc-secondary w3-margin-bottom">
        <i class="fa fa-linkedin"></i> LinkedIn
      </button>
    </div>
    `
  }

  open(source){
    this.analytics.log('send', 'event', 'SocialMediaRedirect', source);
    window.open(this.urlForSource(source), '_blank').focus();
  }

  urlForSource(source){
    switch(source){
      case "facebook": return "https://www.facebook.com/chargepriceapp";
      case "twitter": return "https://twitter.com/chargeprice";
      case "linkedin": return "https://www.linkedin.com/company/chargeprice";
    }
  }
}

