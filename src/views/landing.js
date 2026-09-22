import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';

const HERO_IMAGE = "img/hero-background.png";

export default class LandingPage extends ViewBase {
  constructor(depts) {
    super(depts);
    this.router = depts.router();
    this.translation = depts.translation();
    this.playLink = "https://play.google.com/store/apps/details?id=fr.chargeprice.app";
    this.iosLink = "https://apps.apple.com/us/app/chargeprice/id1552707493";
    this.learnMoreLink = "https://www.chargeprice.net/en/applications/";
    this.dataPlatformLink = "https://www.chargeprice.net/en/charging-intelligence-data/";
    this.imprintLink = "https://www.chargeprice.net/en/imprint/";
  }

  template() {
    return html`
      <div class="landing-page-root">
        <div class="landing-hero" style="background-image:url('${HERO_IMAGE}');">
          <nav class="landing-nav">
            <div class="landing-nav-links">
              <a href="/map" class="landing-nav-link" @click="${(e)=>this.onTryWebApp(e)}">${this.t("landingNavMap")}</a>
              <a href="${this.dataPlatformLink}" target="_blank" class="landing-nav-link">${this.t("landingNavDataPlatform")}</a>
            </div>
          </nav>

          <div class="landing-hero-inner">
            <div class="landing-hero-content">
              <img src="img/CP-logotype-h-black.svg" alt="Chargeprice" class="landing-hero-logo">
              <h1 class="landing-headline">${this.t("landingHeroHeadline")}</h1>
              <p class="landing-subtext">${this.t("landingHeroSubtext")}</p>

              <p class="landing-rating">
                <span class="landing-rating-stars">
                  <i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star-half-o"></i>
                </span>
                <span>${this.t("paywallPrivateRating")}</span>
              </p>
              <p class="landing-get-free">${this.t("paywallPrivateGetItFree")}</p>

              <div class="landing-cta-group">
                <a href="/map" class="landing-webapp-cta" @click="${(e)=>this.onTryWebApp(e)}">
                  ${this.t("landingTryWebAppCta")} &#8594;
                </a>

                <div class="landing-store-badges">
                  <a href="${this.iosLink}" target="_blank" @click="${()=>this.trackAppClick('ios')}">
                    <img src="img/store/app-store-badge.png" alt="Download on the App Store" class="landing-store-badge">
                  </a>
                  <a href="${this.playLink}" target="_blank" @click="${()=>this.trackAppClick('android')}">
                    <img src="img/store/play-store-badge.png" alt="Get it on Google Play" class="landing-store-badge">
                  </a>
                </div>
              </div>

              <div class="landing-stats">
                <div class="landing-stat">
                  <div class="landing-stat-number">${this.t("landingStatUsersNumber")}</div>
                  <div class="landing-stat-label">${this.t("landingStatUsersLabel")}</div>
                </div>
                <div class="landing-stat">
                  <div class="landing-stat-number">${this.t("landingStatTariffsNumber")}</div>
                  <div class="landing-stat-label">${this.t("landingStatTariffsLabel")}</div>
                </div>
              </div>
            </div>

            <div class="landing-hero-screenshots">
              <img src="img/screenshot_pricelist.png" alt="List of charging tariffs for a station" class="landing-screenshot landing-screenshot-back">
              <img src="img/screenshot_map.png" alt="Map of charging stations with live prices" class="landing-screenshot landing-screenshot-front">
            </div>
          </div>
        </div>

        <div class="landing-features">
          <div class="landing-features-inner">
            <div class="landing-feature-grid">
              <div class="landing-feature-card">
                <i class="fa fa-database landing-feature-icon"></i>
                <h3 class="landing-feature-title">${this.t("landingFeatureCoverageTitle")}</h3>
                <p>${this.t("landingFeatureCoverageText")}</p>
              </div>
              <div class="landing-feature-card">
                <i class="fa fa-road landing-feature-icon"></i>
                <h3 class="landing-feature-title">${this.t("landingFeatureRoutePlannerTitle")}</h3>
                <p>${this.t("landingFeatureRoutePlannerText")}</p>
              </div>
              <div class="landing-feature-card">
                <i class="fa fa-handshake-o landing-feature-icon"></i>
                <h3 class="landing-feature-title">${this.t("landingFeaturePartnersTitle")}</h3>
                <p>${this.t("landingFeaturePartnersText")} <a href="${this.learnMoreLink}" target="_blank" class="landing-accent-text">${this.t("paywallLearnMore")}</a></p>
              </div>
            </div>
          </div>
        </div>

        <div class="landing-plans">
          <div class="landing-plans-inner">
            <h2 class="landing-plans-header">${this.t("landingPlansHeader")}</h2>
            <p class="landing-plans-subheader">${this.t("landingPlansSubheader")}</p>

            <div class="landing-plans-grid">
              <div class="landing-plan-card">
                <h3 class="landing-plan-title">${this.t("landingFreeTitle")}</h3>
                <p class="landing-plan-tagline">${this.t("landingFreeTagline")}</p>
                <ul class="landing-plan-features">
                  <li><i class="fa fa-check"></i> ${this.t("landingFreeFeature1")}</li>
                  <li><i class="fa fa-check"></i> ${this.t("landingFreeFeature2")}</li>
                  <li><i class="fa fa-check"></i> ${this.t("landingFreeFeature3")}</li>
                </ul>
              </div>

              <div class="landing-plan-card landing-plan-card-premium">
                <h3 class="landing-plan-title">${this.t("landingPremiumTitle")}</h3>
                <p class="landing-plan-tagline">${this.t("landingPremiumTagline")}</p>
                <ul class="landing-plan-features">
                  <li><i class="fa fa-check-circle"></i> ${this.t("landingPremiumFeature1")}</li>
                  <li><i class="fa fa-check-circle"></i> ${this.t("landingPremiumFeature2")}</li>
                  <li><i class="fa fa-check-circle"></i> ${this.t("landingPremiumFeature3")}</li>
                  <li><i class="fa fa-check-circle"></i> ${this.t("landingPremiumFeature4")}</li>
                </ul>
                <p class="landing-plan-price">${this.t("landingPremiumPrice")}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="landing-footer">
          <a href="${this.imprintLink}" target="_blank" class="landing-imprint-link">${this.t("landingImprintLink")}</a>
          ${this.languageChooser()}
        </div>
      </div>
    `;
  }

  languageChooser() {
    const locales = this.translation.getSupportedLocales();
    const current = this.translation.currentLocale;
    const url = new URL(window.location.href);
    return html`
      <div class="landing-language-chooser">
        ${locales.map(l => {
          url.searchParams.set("lang", l.code);
          return html`<a href="${url.toString()}" title="${l.name}" class="landing-language-flag" style="opacity:${l.code === current ? '1' : '0.5'};">
            <span class="fi fi-${l.flag}"></span>
          </a>`;
        })}
      </div>
    `;
  }

  onTryWebApp(e) {
    e.preventDefault();
    this.router.navigate("/map");
  }

  trackAppClick(platform) {
    this.depts.analytics().log('event', 'app_install_clicked', { platform: platform });
  }

  render() {
    document.documentElement.classList.add("landing-page");
    document.body.classList.add("landing-page");
    render(this.template(), document.getElementById("rootContainer"));
  }
}
