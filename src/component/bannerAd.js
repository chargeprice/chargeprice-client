import { html } from 'lit-html';

// A banner ad from the advertisements API. Only shown in the free version.
export default class BannerAd {
  constructor(depts, premiumGate){
    this.analytics = depts.analytics();
    this.translation = depts.translation();
    this.premiumGate = premiumGate;
  }

  template(ad){
    return html`
      <a href="${ad.deeplinkTarget == "premium" ? "#" : ad.ctaUrl}" target="_blank" rel="noopener" class="banner-ad" @click="${(e)=>this.onClick(e, ad)}">
        <img src="${ad.imageUrl}" alt="${this.translation.get("bannerAdLabel")}">
        <span class="banner-ad-label">${this.translation.get("bannerAdLabel")}</span>
      </a>
    `;
  }

  onClick(event, ad){
    event.stopPropagation();
    this.analytics.log('event', 'ad_banner_clicked', { placement: ad.placement, country: ad.country, ad_id: ad.id });

    if(ad.deeplinkTarget == "premium"){
      event.preventDefault();
      this.premiumGate.showPremiumScreen(`banner_ad_${ad.placement}`);
    }
    // Otherwise the link opens the cta_url in a new tab
  }
}
