import { html, render } from 'lit-html';
import ModalBase from './base';
import Authorization from '../component/authorization';
import PremiumGate from '../component/premiumGate';

const FEATURES = [
  { title: "stripeCheckoutFeatureTariffsWalletTitle", text: "stripeCheckoutFeatureTariffsWalletText" },
  { title: "stripeCheckoutFeatureMapPricesTitle", text: "stripeCheckoutFeatureMapPricesText" },
  { title: "stripeCheckoutFeatureAvailabilityTitle", text: "stripeCheckoutFeatureAvailabilityText" },
  { title: "stripeCheckoutFeatureOperatorFilterTitle", text: "stripeCheckoutFeatureOperatorFilterText" },
  { title: "stripeCheckoutFeatureRoutePlannerTitle", text: "stripeCheckoutFeatureRoutePlannerText" },
  { title: "stripeCheckoutFeatureNoAdsTitle" },
  { title: "stripeCheckoutFeatureMobileAppTitle" }
];

// Features that are premium on the web but free in the mobile app
const FREE_IN_APP_FEATURES = [
  { title: "stripeCheckoutFeatureTariffsWalletTitle", text: "stripeCheckoutFeatureTariffsWalletText" },
  { title: "stripeCheckoutFeatureOperatorFilterTitle", text: "stripeCheckoutFeatureOperatorFilterText" },
  { title: "stripeCheckoutFeatureRoutePlannerTitle", text: "stripeCheckoutFeatureRoutePlannerText" },
  // Not free, so it gets a golden star instead of the green check
  { title: "premiumAppFeaturePremiumAvailable", premium: true }
];

const HERO_IMAGE = "img/hero-background.png";
const PLAY_LINK = "https://play.google.com/store/apps/details?id=fr.chargeprice.app";
const IOS_LINK = "https://apps.apple.com/us/app/chargeprice/id1552707493";
const DATA_PLATFORM_LINK = "https://www.chargeprice.net/en/charging-intelligence-data/";

const MONTHLY_PRICE = 2.99;
const YEARLY_PRICE = 29.99;
const YEARLY_PRICE_PER_MONTH = Math.round((YEARLY_PRICE / 12) * 100) / 100;

function formatPrice(value) {
  return `${value.toFixed(2)} €`;
}

export default class ModalStripeCheckout extends ModalBase {
  constructor(depts) {
    super(depts);
    this.stripe = depts.stripe();
    this.analytics = depts.analytics();
    this.billingCycle = "yearly";
    this.loading = false;
    this.error = null;
    this.showDetails = false;
  }

  show(profile, accessToken, options = {}) {
    this.profile = profile;
    this.accessToken = accessToken;
    this.message = options.message || null;
    this.billingCycle = "yearly";
    this.loading = false;
    this.error = null;
    this.showDetails = false;
    super.show();
  }

  hide() {
    super.hide();
    PremiumGate.onPremiumScreenClosed();
  }

  rerender() {
    render(this.template(), this.getEl(this.root));
  }

  template() {
    return html`
      <div class="w3-modal-content w3-animate-top premium-modal">
        <div class="premium-hero" style="background-image:url('${HERO_IMAGE}');">
          <button @click="${() => this.hide()}" class="w3-button premium-hero-close" title="close">
            <img class="inverted" src="img/close.svg">
          </button>
          <div class="premium-hero-content">
            <p class="header-font premium-hero-title">
              <i class="fa fa-star premium-hero-star"></i> ${this.t("stripeCheckoutTagline")}
            </p>
            <p class="premium-hero-quote">&ldquo;${this.t("stripeCheckoutQuote")}&rdquo;</p>
          </div>
        </div>
        ${this.message ? html`
          <div class="premium-context-message">
            <i class="fa fa-mobile"></i> ${this.message}
          </div>
        ` : ""}
        <div class="w3-container w3-padding w3-center">
          <div class="premium-columns">
            <div class="premium-col-app">
              ${this.mobileAppTemplate()}
            </div>

            <div class="premium-divider premium-columns-divider"><span>${this.t("premiumOr")}</span></div>

            <div class="premium-col-web">
              <p class="premium-section-title">${this.t("premiumWebTitle")}</p>
              <p class="w3-small w3-text-dark-gray" style="margin-top:0;">${this.t("premiumWebText")}</p>

              ${this.featureListTemplate(FEATURES)}

              <div class="premium-billing-options">
                <div
                  class="w3-padding cp-billing-option ${this.billingCycle === "monthly" ? "pc-secondary" : ""}"
                  @click="${() => this.selectBillingCycle("monthly")}"
                >
                  <div style="font-weight:600;">${this.t("stripeCheckoutMonthly")}</div>
                  <div style="font-size:1.2em;font-weight:700;margin-top:4px;">${formatPrice(MONTHLY_PRICE)}</div>
                  <div class="w3-small">${this.t("stripeCheckoutPerMonth")}</div>
                </div>
                <div
                  class="w3-padding cp-billing-option ${this.billingCycle === "yearly" ? "pc-secondary" : ""}"
                  @click="${() => this.selectBillingCycle("yearly")}"
                >
                  <span class="w3-small w3-round premium-popular-badge">${this.t("stripeCheckoutMostPopular")}</span>
                  <div style="font-weight:600;">${this.t("stripeCheckoutYearly")}</div>
                  <div style="font-size:1.2em;font-weight:700;margin-top:4px;">${formatPrice(YEARLY_PRICE)}</div>
                  <div class="w3-small">${this.sf(this.t("stripeCheckoutYearlyEquivalent"), formatPrice(YEARLY_PRICE_PER_MONTH))}</div>
                </div>
              </div>

              ${this.error ? html`<p class="w3-text-red w3-small">${this.error}</p>` : ""}

              <button
                @click="${() => this.onContinue()}"
                ?disabled="${this.loading}"
                class="w3-btn pc-secondary w3-block w3-padding"
              >
                ${this.loading ? html`<i class="fa fa-spinner fa-spin"></i>` : (this.billingCycle === "yearly" ? this.t("premiumTrial") : this.t("stripeCheckoutContinue"))}
              </button>
              <p class="premium-fleet-hint">
                ${this.t("premiumFleetLicenses")} <a href="mailto:sales@chargeprice.net" class="link-text">sales@chargeprice.net</a>
              </p>
            </div>
          </div>

          ${this.dataPlatformTemplate()}
        </div>
      </div>
    `;
  }

  // The mobile app comes first: most users should get the free app, the paid web access is mainly for professionals
  mobileAppTemplate() {
    return html`
      <div class="premium-app-section">
        <span class="w3-tag w3-round premium-free-badge premium-app-free-badge">${this.t("premiumFreeBadge")}</span>
        <p class="premium-app-title">${this.t("premiumAppTitle")}</p>
        <div class="premium-app-proof">
          <div class="premium-app-stat">
            <div class="premium-app-stat-value premium-app-stars"><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star-half-o"></i></div>
            <div class="premium-app-stat-label">${this.t("paywallPrivateRating")}</div>
          </div>
          <div class="premium-app-stat">
            <div class="premium-app-stat-value">${this.t("landingStatUsersNumber")}</div>
            <div class="premium-app-stat-label">${this.t("landingStatUsersLabel")}</div>
          </div>
        </div>
        ${this.featureListTemplate(FREE_IN_APP_FEATURES)}
        <div class="premium-app-download">
          <div class="premium-app-badges">
            <a href="${IOS_LINK}" target="_blank" @click="${() => this.onDownloadApp("ios")}">
              <img src="img/store/app-store-badge.png" alt="Download on the App Store" class="premium-app-badge">
            </a>
            <a href="${PLAY_LINK}" target="_blank" @click="${() => this.onDownloadApp("android")}">
              <img src="img/store/play-store-badge.png" alt="Get it on Google Play" class="premium-app-badge">
            </a>
          </div>
          <!-- Desktop only: the QR code leads to tosto.re/chargeprice, which redirects to the right app store -->
          <div class="premium-app-qr">
            <img src="img/qr-mobile-app.svg?v=1" alt="QR code to download the Chargeprice mobile app">
            <span class="w3-small">${this.t("premiumAppScanQr")}</span>
          </div>
        </div>
      </div>
    `;
  }

  featureListTemplate(features) {
    return html`
      <ul class="premium-feature-list">
        ${features.map(feature => html`
          <li>
            <i class="fa ${feature.premium ? "fa-star premium-feature-icon-premium" : "fa-check-circle"} pc-main-text premium-feature-icon"></i>
            <span>
              <span class="premium-feature-title">${this.t(feature.title)}</span>
              ${feature.text && this.showDetails ? html`<span class="w3-small w3-block w3-text-dark-gray">${this.t(feature.text)}</span>` : ""}
            </span>
          </li>
        `)}
      </ul>
      ${features.some(feature=>feature.text) ? html`
        <a href="#" class="link-text w3-small premium-details-toggle" @click="${(e)=>{e.preventDefault(); this.onToggleDetails();}}">
          ${this.t(this.showDetails ? "premiumLessDetails" : "premiumMoreDetails")}
        </a>
      ` : ""}
    `;
  }

  // One toggle for both lists, so the two columns stay aligned
  onToggleDetails() {
    this.showDetails = !this.showDetails;
    this.rerender();
  }

  // For people analysing charging data professionally, Premium isn't the right product
  dataPlatformTemplate() {
    return html`
      <div class="premium-data-platform">
        <i class="fa fa-database premium-data-platform-icon"></i>
        <div>
          <p class="premium-data-platform-title">${this.t("premiumDataPlatformTitle")}</p>
          <p class="premium-data-platform-text">
            ${this.t("premiumDataPlatformText")}
            <a href="${DATA_PLATFORM_LINK}" target="_blank" class="link-text" @click="${() => this.onDataPlatformClicked()}">${this.t("premiumAppLink")}</a>
          </p>
        </div>
      </div>
    `;
  }

  onDataPlatformClicked() {
    this.analytics.log('event', 'data_platform_premium_screen_clicked');
  }

  onDownloadApp(platform) {
    this.analytics.log('event', 'app_install_premium_screen_clicked', { platform: platform });
  }

  selectBillingCycle(cycle) {
    this.billingCycle = cycle;
    this.error = null;
    this.rerender();
  }

  async onContinue() {
    // Checkout needs an account, so ask to log in or register first
    if (!this.profile || !this.accessToken) {
      new Authorization(this.depts).render();
      return;
    }

    this.loading = true;
    this.error = null;
    this.rerender();

    try {
      const url = await this.stripe.createCheckoutSession(this.profile.userId, this.accessToken, "mobile_premium", this.billingCycle);
      window.location.href = url;
    } catch (error) {
      this.loading = false;
      this.error = this.t("stripeCheckoutError");
      this.rerender();
    }
  }
}
