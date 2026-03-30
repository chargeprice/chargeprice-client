import {html, render} from 'lit-html';
import ModalBase from './base';
import Authorization from '../component/authorization';

export default class ModalPaywall extends ModalBase {
  constructor(depts, step='intro'){
    super(depts);
    this.analytics = depts.analytics();
    this.themeLoader = depts.themeLoader();
    this.settings = depts.settingsPrimitive();
    this.step = step;
    this.playLink = "https://play.google.com/store/apps/details?id=fr.chargeprice.app";
    this.iosLink = "https://apps.apple.com/us/app/chargeprice/id1552707493";
    this.proLink = "https://www.chargeprice.net/en/charging-intelligence-data/";
  }

  template(){
    if(this.step === 'private') return this.privateTemplate();
    if(this.step === 'pro') return this.proTemplate();
    return this.introTemplate();
  }

  introTemplate(){
    const trackingAsked = this.settings.getBoolean("askedForTracking", false);
    return html`
    <div class="w3-modal-content">
      <div class="w3-container w3-padding w3-center">
        <img src="img/logos/logo-blue.png" alt="Chargeprice" style="max-width:280px;height:auto;margin:16px 0 8px;">
        <p class="pc-main-text header-font" style="font-size:1.4em;font-weight:600;margin-bottom:4px;">${this.t("paywallProAppHeader")}</p>
        <p class="pc-main-text">${this.t("paywallProAppSubheader")}</p>

        <p class="w3-center"><strong>${this.t("paywallUserTypeQuestion")}</strong></p>
        <div class="w3-row w3-margin-top">
          <div class="w3-half w3-padding-small w3-center">
            <button @click="${()=>this.setStep('private')}" class="w3-btn pc-secondary w3-block">
              ${this.t("paywallPrivateUserBtn")}
            </button>
          </div>
          <div class="w3-half w3-padding-small w3-center">
            <button @click="${()=>this.setStep('pro')}" class="w3-btn pc-secondary w3-block">
              ${this.t("paywallProUserBtn")}
            </button>
          </div>
        </div>
        <hr>
        <button @click="${()=>this.onOpenLogin()}" class="w3-btn w3-light-grey w3-block w3-margin-top w3-margin-bottom">
          ${this.t("paywallLoginCta")}
        </button>
      </div>
      ${!trackingAsked ? html`
      <div class="w3-container w3-padding">
        <input id="allowTracking" class="w3-check" type="checkbox" checked>
        <label>${this.t("cookieConstentHeader")}</label>
        <p class="w3-small">${this.t("cookieConstentText")}</p>
      </div>` : ''}
      ${this.languageChooser()}
    </div>
    `;
  }

  privateTemplate(){
    return html`
    <div class="w3-modal-content">
      <div class="w3-container w3-padding">
        <div style="display:flex;gap:16px;align-items:flex-start;">
          <div style="flex:1;min-width:0;">
            <p class="pc-main-text header-font" style="font-size:1.4em;font-weight:600;margin-bottom:4px;">${this.t("paywallPrivateAppHeader")}</p>
            <p class="pc-main-text">${this.t("paywallPrivateAppSubheader")}</p>
            <p>
              <span style="color:#f5a623;">
                <i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star-half-o"></i>
              </span>
              <span class="w3-small"> ${this.t("paywallPrivateRating")}</span>
            </p>
            <p><strong>${this.t("paywallPrivateGetItFree")}</strong></p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <a href="${this.iosLink}" target="_blank" @click="${()=>this.trackAppClick('ios')}">
                <img src="img/store/app-store-badge.png" alt="Download on the App Store" style="max-width:150px;height:auto;">
              </a>
              <a href="${this.playLink}" target="_blank" @click="${()=>this.trackAppClick('android')}">
                <img src="img/store/play-store-badge.png" alt="Get it on Google Play" style="max-width:150px;height:auto;">
              </a>
            </div>

            <div class="w3-panel w3-pale-blue w3-leftbar w3-border-blue w3-margin-top" style="border-radius:6px;">
              <p><strong>${this.t("paywallWebPaidCardHeader")}</strong></p>
              <p>${this.t("paywallWebPaidCardText")}</p>
            </div>

            <p>${this.t("paywallPrivateText1")}</p>
            <p>${this.t("paywallPrivateText2")}</p>
            <p>${this.t("paywallPrivateText3")} <a href="${this.t("paywallDotNetApps")}" target="_blank">${this.t("paywallLearnMore")}</a></p>
            
            <p class="w3-margin-top"><strong>${this.t("paywallPrivatePcHeader")}</strong></p>
            <p>
              ${this.t("paywallPrivatePcText")}
            </p>
          </div>
          <div style="width:38%;max-width:200px;margin-top: 50px; flex-shrink:0;">
            <img src="img/graphics/app_screenshot.png" alt="Chargeprice App" style="width:100%;object-fit:contain;display:block;">
          </div>
        </div>
      </div>

      <div class="w3-container w3-padding">
        <button @click="${()=>this.setStep('intro')}" class="w3-btn w3-small w3-light-grey">&#8592; ${this.t("back")}</button>
      </div>
      ${this.languageChooser()}
    </div>
    `;
  }

  proTemplate(){
    return html`
    <div class="w3-modal-content">
      <div class="w3-container w3-padding">
        <div style="display:flex;gap:16px;align-items:flex-start;">
          <div style="flex:1;min-width:0;">
            <p class="pc-main-text header-font" style="font-size:1.4em;font-weight:600;margin-bottom:4px;">${this.t("paywallProAppHeader")}</p>
            <p class="pc-main-text">${this.t("paywallProAppSubheader")}</p>

            <p><strong>${this.t("paywallProDataHeader")}</strong></p>
            <p>${this.t("paywallProDataText1")}</p>
            <p>${this.t("paywallProDataText2")}</p>

            <p><strong>${this.t("paywallProPromotionHeader")}</strong></p>
            <p>${this.t("paywallProPromotionText")}</p>

            <div class="w3-margin-top w3-margin-bottom">
              <a href="${this.t("paywallDotNetQuotePro")}" target="_blank" @click="${()=>this.trackProClick()}">
                <button class="w3-btn pc-secondary w3-padding-large">
                  ${this.t("paywallRequestQuoteCta")}
                </button>
              </a>
            </div>
          </div>
          <div style="width:38%;max-width:200px;margin-top:50px;flex-shrink:0;">
            <img src="img/graphics/data_screenshot.png" alt="Chargeprice Data" style="width:100%;object-fit:contain;display:block;">
          </div>
        </div>
      </div>
      <div class="w3-container w3-padding">
        <button @click="${()=>this.setStep('intro')}" class="w3-btn w3-small w3-light-grey">&#8592; ${this.t("back")}</button>
      </div>
      ${this.languageChooser()}
    </div>
    `;
  }

  languageChooser(){
    const locales = this.translation.getSupportedLocales();
    const current = this.translation.currentLocale;
    const url = new URL(window.location.href);
    return html`
    <div class="w3-container w3-padding w3-center" style="border-top:1px solid #e0e0e0;margin-top:4px;">
      ${locales.map(l => {
        url.searchParams.set("lang", l.code);
        return html`<a href="${url.toString()}" title="${l.name}" style="margin:0 4px;text-decoration:none;opacity:${l.code === current ? '1' : '0.4'};">
          <span class="fi fi-${l.flag}" style="font-size:1.4em;"></span>
        </a>`;
      })}
    </div>`;
  }

  setStep(step){
    this.saveTrackingConsent();
    this.step = step;
    this.show();
  }

  saveTrackingConsent(){
    if(this.settings.getBoolean("askedForTracking", false)) return;
    this.settings.setBoolean("askedForTracking", true);
    if(this.isChecked("allowTracking")) this.analytics.consentGranted();
  }

  trackAppClick(platform){
    this.analytics.log('event', 'welcome_app_install_clicked', { platform });
  }

  trackProClick(){
    this.analytics.log('event', 'welcome_pro_clicked');
  }

  onOpenLogin(){
    this.saveTrackingConsent();
    new Authorization(this.depts).render();
  }
}
