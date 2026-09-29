import { html } from 'lit-html';

const PLAY_LINK = "https://play.google.com/store/apps/details?id=fr.chargeprice.app";
const IOS_LINK = "https://apps.apple.com/us/app/chargeprice/id1552707493";

// Free version upsell: the feature is free in the mobile app, or available on the web with Premium
export default class AppUpsellBanner {
  constructor(depts, premiumGate){
    this.analytics = depts.analytics();
    this.translation = depts.translation();
    this.premiumGate = premiumGate;
  }

  // source: identifies the placement in analytics, e.g. "price_list_banner"
  template({ title, text, source }){
    const t = key => this.translation.get(key);

    return html`
      <div class="premium-banner">
        <div class="premium-banner-app">
          <p class="premium-banner-title">
            <span class="w3-tag w3-round w3-small premium-free-badge">${t("premiumFreeBadge")}</span>
            ${title}
          </p>
          ${text ? html`<p class="premium-banner-text">${text}</p>` : ""}
          <div class="premium-banner-actions">
            <a href="${IOS_LINK}" target="_blank" @click="${()=>this.onDownloadApp("ios", source)}">
              <img src="img/store/app-store-badge.png" alt="Download on the App Store" class="premium-banner-badge">
            </a>
            <a href="${PLAY_LINK}" target="_blank" @click="${()=>this.onDownloadApp("android", source)}">
              <img src="img/store/play-store-badge.png" alt="Get it on Google Play" class="premium-banner-badge">
            </a>
          </div>
        </div>
        <div class="premium-banner-web w3-small">
          <i class="fa fa-star premium-star-inline"></i>
          ${t("premiumBannerWebText")}
          <a href="#" class="link-text" @click="${(e)=>{e.preventDefault(); this.premiumGate.showPremiumScreen(source);}}">${t("premiumBannerWebCta")}</a>
        </div>
      </div>
    `;
  }

  onDownloadApp(platform, source){
    this.analytics.log('event', 'app_install_price_list_clicked', { platform: platform, source: source });
  }
}
