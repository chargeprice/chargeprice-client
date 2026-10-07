import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModalWelcome extends ModalBase {
  constructor(depts){
    super(depts);
    this.analytics = depts.analytics();
    this.themeLoader = depts.themeLoader();
    this.settings = depts.settingsPrimitive();
    this.eventBus = depts.eventBus();
  }

  template(){
    const theme = this.themeLoader.getCurrentThemeConfig();

    return html`
    <div class="w3-modal-content w3-animate-top welcome-modal">
      <div class="welcome-hero ${theme.welcomeLogo ? "welcome-hero-light" : ""}" style="${theme.welcomeLogo ? "" : `background:${theme.themeColor};`}">
        <div class="welcome-hero-content">
          ${this.logoTemplate(theme)}
          ${theme.welcomeText ?
            html`<p class="welcome-hero-text welcome-hero-theme-text">${theme.welcomeText}</p>` :
            html`<p class="welcome-hero-text">${this.ut("popupWelcomeText1")}</p>`}
        </div>
      </div>

      <div class="welcome-body">
        <div class="welcome-vehicle-hint">
          <i class="fa fa-car"></i>
          <p>${this.ut("popupWelcomeText2")}</p>
        </div>

        <button @click="${()=>this.onChooseVehicle()}" class="w3-btn pc-secondary welcome-cta">
          ${this.t("popupWelcomeChooseVehicleCta")}
        </button>
        <button @click="${()=>this.onChooseLater()}" class="w3-button welcome-later">
          ${this.t("popupWelcomeLaterCta")}
        </button>

        <div class="welcome-consent">
          <input id="allowTracking" class="w3-check" type="checkbox" checked>
          <label for="allowTracking">${this.t("cookieConstentHeader")}</label>
          <p>${this.ut("cookieConstentText")}</p>
        </div>
      </div>
    </div>
    `
  }

  logoTemplate(theme){
    if(this.themeLoader.isDefaultTheme()) return html`<img src="img/CP-logotype-h-white.svg" alt="Chargeprice" class="welcome-hero-logo">`;
    if(theme.welcomeLogo) return html`<img src="${theme.welcomeLogo}" alt="${theme.name}" class="welcome-hero-logo welcome-hero-logo-large">`;
    return html`<p class="header-font welcome-hero-title">${this.sf(this.t("popupWelcomeHeader"), theme.name)}</p>`;
  }

  onChooseVehicle(){
    // After the consent, so the event is tracked if it was given
    this.continueAndSetTracking();
    this.analytics.log('event', 'welcome_closed', { action: "choose_vehicle" });
    this.eventBus.publish("sidebar.change", { sidebar: "vehicleSelection" });
  }

  onChooseLater(){
    this.continueAndSetTracking();
    this.analytics.log('event', 'welcome_closed', { action: "later" });
  }

  continueAndSetTracking(){
    this.settings.setBoolean("askedForTracking", true);
    const trackingAllowed = this.isChecked("allowTracking");
    if(trackingAllowed) this.analytics.consentGranted();

    this.hide();
  }
}
