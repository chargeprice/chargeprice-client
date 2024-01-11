import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModalWelcome extends ModalBase {
  constructor(depts){
    super(depts);
    this.analytics = depts.analytics();
    this.themeLoader = depts.themeLoader();
    this.settings = depts.settingsPrimitive();
  }

  template(){
    const themeName = this.themeLoader.getCurrentThemeConfig().name;

    return html`
    <div class="w3-modal-content">
      ${this.header(this.sf(this.t("popupWelcomeHeader"), themeName), false)}
      <div class="w3-container w3-padding">
        <p>${this.t("popupWelcomeText1")}</p>
        <p>${this.t("popupWelcomeText2")}</p>

        <hr>

        <input id="allowTracking" class="w3-check" type="checkbox" checked>
        <label>${this.t("cookieConstentHeader")}</label>
        <p class="w3-small">${this.t("cookieConstentText")}</p>
      </div>

      <button @click="${()=>this.onContinueAndSetTracking()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
        ${this.t("popupWelcomeCTA")}
      </button>
    </div>
    `
  }

  onContinueAndSetTracking(){
    this.settings.setBoolean("askedForTracking", true);
    const trackingAllowed = this.isChecked("allowTracking");
    if(trackingAllowed) this.analytics.consentGranted();

    this.hide();
  }
}

