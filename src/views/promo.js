import { html, render } from 'lit-html';
import LandingPage from './landing';
import Authorization from '../component/authorization';
import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile';

export default class PromoPage extends LandingPage {
  constructor(depts) {
    super(depts);
    this.stripe = depts.stripe();
    this.userSettingsRepo = depts.userSettings();
    this.settingsRepo = depts.settingsPrimitive();
    this.profile = null;
    this.accessToken = null;
    this.isPremium = false;
    this.promoCode = "";
    this.loading = false;
    this.error = null;
  }

  isLoggedIn() {
    return !!this.profile;
  }

  getFreeTextTemplate() {
    if (this.isPremium) return "";
    return html`<p class="landing-get-free">${this.t("promoClaimOffer")}</p>`;
  }

  ctaGroupTemplate() {
    if (this.isPremium) {
      return html`
        <div class="landing-cta-group">
          <p class="landing-get-free">${this.t("promoAlreadyPremium")}</p>
        </div>
      `;
    }

    return html`
      <div class="landing-cta-group">
        ${!this.isLoggedIn() ? html`
          <button class="landing-webapp-cta landing-promo-login-cta" @click="${()=>this.onLogin()}">
            ${this.t("promoLoginCta")}
          </button>
        `:""}

        <div class="landing-promo-form">
          <input
            .value="${this.promoCode}"
            @input="${(e)=>this.onPromoCodeChanged(e.target.value)}"
            placeholder="${this.t("promoCodePlaceholder")}"
            class="landing-promo-input"
            ?disabled="${!this.isLoggedIn() || this.loading}"
          />
          <button
            class="landing-webapp-cta landing-promo-cta"
            @click="${()=>this.onValidate()}"
            ?disabled="${!this.isLoggedIn() || !this.promoCode.trim() || this.loading}">
            ${this.loading ? this.t("promoValidating") : this.t("promoValidateCta")}
          </button>
        </div>

        ${this.error ? html`<p class="landing-promo-error">${this.error}</p>` : ""}

        <div class="landing-store-badges landing-promo-store-badges">
          <a href="${this.iosLink}" target="_blank" @click="${()=>this.trackAppClick('ios')}">
            <img src="img/store/app-store-badge.png" alt="Download on the App Store" class="landing-store-badge">
          </a>
          <a href="${this.playLink}" target="_blank" @click="${()=>this.trackAppClick('android')}">
            <img src="img/store/play-store-badge.png" alt="Get it on Google Play" class="landing-store-badge">
          </a>
        </div>
      </div>
    `;
  }

  template() {
    return html`
      ${super.template()}
      <div id="messageDialog" class="w3-modal"></div>
    `;
  }

  async render() {
    this.consumeTokensFromUrl();
    await this.loadProfile();

    this.depts.themeLoader().loadThemeStylesheet();
    document.documentElement.classList.add("landing-page");
    document.body.classList.add("landing-page");
    this.rerender();
  }

  rerender() {
    render(this.template(), document.getElementById("rootContainer"));
  }

  consumeTokensFromUrl() {
    const params = new URL(window.location.href).searchParams;
    if (!params.has("access_token") || !params.has("refresh_token")) return;

    this.settingsRepo.authTokens().set({
      accessToken: params.get("access_token"),
      refreshToken: params.get("refresh_token"),
    });

    params.delete("access_token");
    params.delete("refresh_token");

    const query = params.toString();
    const newUrl = window.location.pathname + (query ? `?${query}` : "") + window.location.hash;
    window.history.replaceState({}, "", newUrl);
  }

  async loadProfile() {
    try {
      const { accessToken, profile } = await new FetchAccessTokenWithProfile(this.depts).run();
      this.accessToken = accessToken;
      this.profile = profile;
      await this.loadPremiumStatus();
    }
    catch (error) {
      this.profile = null;
      this.accessToken = null;
    }
  }

  async loadPremiumStatus() {
    try {
      const settings = await this.userSettingsRepo.show();
      const products = (settings.meta && settings.meta.products) || [];
      this.isPremium = products.includes("mobile_premium") || products.includes("web_pro");
    }
    catch (error) {
      this.isPremium = false;
    }
  }

  onLogin() {
    new Authorization(this.depts, { whitelabel: "dot_app_promo" }).render();
  }

  onPromoCodeChanged(value) {
    this.promoCode = value;
    this.rerender();
  }

  async onValidate() {
    if (!this.isLoggedIn() || !this.promoCode.trim() || this.loading) return;

    this.loading = true;
    this.error = null;
    this.rerender();

    try {
      const url = await this.stripe.createCheckoutSession(
        this.profile.userId,
        this.accessToken,
        "mobile_premium",
        "yearly",
        this.promoCode.trim()
      );
      window.location.href = url;
    }
    catch (error) {
      this.loading = false;
      this.error = error && error.code === "INVALID_PROMO_CODE" ? this.t("promoInvalidCode") : this.t("stripeCheckoutError");
      this.rerender();
    }
  }
}
