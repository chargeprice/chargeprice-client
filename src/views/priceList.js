import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
export default class PriceListView extends ViewBase {
  constructor(depts) {
    super(depts);
    this.analytics = depts.analytics();
  }

  template(prices){
    return prices.map(p=>{
      const tariff = p.tariff;
      return html`
      <tr style="${p.featuring ? `background: ${p.featuring.backgroundColor} !important;` : ""}" >
        ${this.tariffOverviewTemplate(p,tariff)}
        ${this.priceTemplate(p,tariff)}
      </tr>
    `});
  }

  tariffOverviewTemplate(price,tariff){
    return html`
    <td class="cp-price-left">
      ${tariff.tariffName == null || tariff.tariffName == tariff.provider ?
        html`<a class="tariff-link" @click="${()=>this.onAffiliateClicked(tariff)}" href="${tariff.url}" target="_blank"><span class="${this.isMyTariff(tariff)?"bold":""}">${tariff.provider}</span></a>` :
        html`<a class="tariff-link" @click="${()=>this.onAffiliateClicked(tariff)}" href="${tariff.url}" target="_blank"><span class="${this.isMyTariff(tariff)?"bold":""}">${tariff.tariffName}</span></a><br>
            ${!price.featuring ? html`<label class="w3-margin-top w3-small ${this.isMyTariff(tariff)?"bold":""}">${tariff.provider}</label>`:""}`
      }
      ${this.renderTags(price.tariff.tags)}
      ${tariff.totalMonthlyFee > 0 || tariff.monthlyMinSales > 0 ?
        html`
          <label class=" w3-small w3-block">
          ${tariff.totalMonthlyFee > 0 ? `${this.t("baseFee")}: ${this.h().dec(tariff.totalMonthlyFee)}/${this.t("month")}**`:"" }
          ${tariff.monthlyMinSales > 0 ? `${this.t("minSales")}:${this.h().dec(tariff.monthlyMinSales)}/${this.t("month")}`:"" }
          </label>
        `:""}
      ${tariff.providerCustomerTariff ?
        html`
          <label class="w3-small w3-block">${this.t("providerCustomerOnly")}</label> 
        `:""}
      ${price.featuring ? html`
        <a href="${tariff.url}" target="_blank"><img class="feature-logo" src="${price.featuring.logoUrl}"/></a>
      `:""}
      ${this.h().customConfig.isBeta() && tariff.links && tariff.links.open_app_at_station ?
        html`<br>
        <a href="${tariff.links.open_app_at_station}" class="w3-button w3-small w3-blue" target="_blank"><i class="fa fa-bolt"></i> Start Charging!</a> 
        `:""}
    </td>
    `;
  }

  priceTemplate(price,tariff){
    return html`
    <td class="cp-price-right">
      <label class="w3-right ${this.isMyTariff(tariff)?"bold":""}">${this.isMyTariff(tariff) ? html`<i class="fa fa-star fav-icon"></i> `:"" }${this.h().dec(price.price)}</label><br>
      ${price.price > 0 ?
        html`<label class="w3-right w3-small">${this.t("average")} ${this.h().dec(price.pricePerKWh)}/kWh</label><br>`:""
      }
      <label class="w3-right w3-small">
        ${price.distribution.session ? `${(price.distribution.session < 1 ? this.h().perc(price.distribution.session) : "")} ${this.t("session")}` : ""}
        ${price.distribution.minute ? html`${(price.distribution.minute < 1 ? this.h().perc(price.distribution.minute) : "")} ${this.t("per")} <i class="fa fa-clock-o"></i>` : ""}
        ${price.distribution.kwh ? `${(price.distribution.kwh < 1 ? this.h().perc(price.distribution.kwh) : "")} ${this.t("per")} kWh` : ""}
      </label>
    </td>
    `;
  }

  renderTags(tags){
    if(tags.length==0) return "";
    const colorMapping = {
      alert: "w3-deep-orange",
      info: "pc-main",
      star: "w3-green",
      lock: "w3-dark-gray"
    }
    const iconMapping = {
      alert: "exclamation",
      info: "info",
      star: "star",
      lock: "lock"
    }
    const entries = tags.map(tag=>
      html`
        <span class="${ `w3-tag w3-small cp-margin-top-right-small ${colorMapping[tag.kind]}`}"><label><i class="${`fa fa-${iconMapping[tag.kind]}`}"></i> 
          ${tag.url ? html`<a href="${tag.url.replace("{locale}",this.translation.currentLocaleOrFallback())}" target="_blank">${tag.text}</a>` : tag.text}
        </label>
    `);
    return html`<div>${entries}</div>`
  }

  render(prices, myTariffs,root){
    this.myTariffs = myTariffs;
    render(this.template(prices),this.getEl(root));
  }

  onAffiliateClicked(tariff){
    this.analytics.log('send', 'event', 'AffiliateEMP', tariff.url);
  }

  isMyTariff(tariff){
    return this.myTariffs.some(t=>t.id == tariff.tariff.id); 
  }
}

