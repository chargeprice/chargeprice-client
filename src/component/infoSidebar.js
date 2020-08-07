import { html, render } from 'lit-html';
import ViewBase from './viewBase';
import ModalFeedback from '../modal/feedback';
export default class InfoSidebar extends ViewBase {
  constructor(depts) {
    super(depts.translation());
    this.depts = depts;
  }

  template(){
    return html`
    <div class="w3-margin-bottom">
      <label class="w3-margin-top w3-large">${this.t("poiKey")}</label><br>
      <span class="w3-tag w3-green w3-margin-top" style="background: #575757 !important">${this.sf(this.t("chargePowerTo"),3.7)}</span>
      <span class="w3-tag w3-green w3-margin-top" style="background: #36a5d8 !important">${this.sf(this.t("chargePowerTo"),22)}</span>
      <span class="w3-tag w3-green w3-margin-top" style="background: #f4952f !important">${this.sf(this.t("chargePowerTo"),50)}</span>
      <span class="w3-tag w3-green w3-margin-top" style="background: #9d3135 !important">${this.sf(this.t("chargePowerFrom"),50)}</span>    
      <span class="w3-tag w3-green w3-margin-top" style="background: #d33d2a !important">${this.t("locationPin")}</span>    
    </div>

    <div id="theme-info" class="w3-margin-bottom">
      <span id="theme-name"></span> ${this.t("poweredBy")} <a href="https://www.chargeprice.app" target="_blank">Chargeprice</a>
    </div>

    <button id="btAppInstall" class="w3-btn pc-secondary w3-margin-top w3-margin-bottom hidden">
      <img class="inverted" src="img/download.svg">
      ${this.t("installApp")}
    </button>
    
    <div id="donate-button" class="w3-margin-bottom">
      <label class="w3-margin-top w3-large">${this.t("aboutHeader")}</label><br>
      <a href="http://www.chargeprice.net">chargeprice.net</a>
    </div>

    <div class="w3-margin-bottom">
      <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
      <input type="hidden" name="cmd" value="_s-xclick" />
      <input type="hidden" name="hosted_button_id" value="48LQQZJAW7W42" />
      <input type="image" src="https://www.paypalobjects.com/${this.t('paypalLocale')}/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
      </form>
    </div>

    <p>
      <button @click="${()=>this.onGiveFeedback("other_feedback")}" class="w3-btn pc-secondary w3-margin-top">${this.t("fbGiveFeedback")}</button>
      <button @click="${()=>this.onGiveFeedback("missing_station")}" class="w3-btn pc-secondary w3-margin-top">${this.t("fbReportMissingStationHeader")}</button>
    </p>

    <label class="w3-margin-top w3-large">${this.t("partnerHeader")}</label><br>
    <a id="greenDriveLink" href="https://www.greendrive-accessories.com/" target="_blank"><img width="100%" src="img/partners/greendrive.png"></a>
    <br><br>

    <label class="w3-margin-top w3-large">${this.t("dataSourceHeader")}</label><br>
    <ul>
      <li>${this.ut("dataSourceContentGoingElectric")}</li>
      <li>${this.t("dataSourceContentOther")}</li>
    </ul>

    <label class="w3-margin-top w3-large">${this.t("disclaimerHeader")}</label><br>
    <div class="w3-margin-bottom">${this.t("disclaimerContent")}</div>

    <label class="w3-margin-top w3-large">${this.t("openSourceHeader")}</label><br>
    <div class="w3-margin-bottom">
      <a href="https://github.com/chargeprice/chargeprice-client" target="_blank">Chargeprice (Github)</a><br>
      <a href="https://github.com/chargeprice/chargeprice-api-docs" target="_blank">Chargeprice API (Github)</a><br>
      <a href="https://github.com/chargeprice/open-ev-data" target="_blank">Open EV Data (Github)</a><br>
    </div>
    `;
  }

  render(){
    render(this.template(),document.getElementById("infoContent"));
  }

  onGiveFeedback(type){
    new ModalFeedback(this.depts).show(type);
  }
}

