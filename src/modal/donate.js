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
        <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
          <input type="hidden" name="cmd" value="_s-xclick" />
          <input type="hidden" name="hosted_button_id" value="48LQQZJAW7W42" />
          <input type="image" @click="${()=>this.donate()}" src="https://www.paypalobjects.com/${this.t('paypalLocale')}/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
        </form>
      </div>
      <br>
    </div>
    `
  }

  donate(){
    this.analytics.log('send', 'event', 'Donation', 'popup');
  }
}

