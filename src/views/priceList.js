import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
export default class PriceListView extends ViewBase {
  constructor(depts,sidebar) {
    super(depts);
    this.analytics = depts.analytics();
    this.currency = depts.currency();
    this.sidebar = sidebar;
  }

  template(pricesForMyTariffs, otherPrices){
    return html`
      ${pricesForMyTariffs.length > 0 ? 
      html`<table class="w3-table w3-striped w3-margin-top">
        <tr>
          <th width="60%"><i class="fa fa-star fav-icon"></i> <a href="#" class="tariff-link" @click="${()=>this.onManageMyTariffs()}">${this.t("myTariffs")} <i class="fa fa-pencil"></a></th>
          <th class="w3-right cp-price-right">${this.currency.getDisplayedCurrency()}</th>
        </tr>
        <tbody>
          ${this.rowsTemplate(pricesForMyTariffs)}
        </tbody>
      </table>
      `:""}

        ${pricesForMyTariffs.length > 0 && otherPrices.length > 0 ? html`
          <hr/>
        `:""}

      ${otherPrices.length > 0 ? 
        html`<table class="w3-table w3-striped w3-margin-top">
          <tr>
            <th width="60%">${pricesForMyTariffs.length > 0 ? this.t("otherTariffs") : this.t("tariff")}</th>
            <th class="w3-right cp-price-right">${this.currency.getDisplayedCurrency()}</th>
          </tr>
          <tbody>
            ${this.rowsTemplate(otherPrices)}
          </tbody>
        </table>
        `:""}
      <div class="w3-margin-top w3-small w3-container">
        ${this.ut("totalPriceInfo")}
      </div>
    `;
  }

  rowsTemplate(prices){
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
        html`<a class="tariff-link" @click="${()=>this.onAffiliateClicked(tariff)}" href="${tariff.url}" target="_blank"><span class="${this.isMyTariff(tariff)?"":""}">${tariff.provider}</span></a>` :
        html`<a class="tariff-link" @click="${()=>this.onAffiliateClicked(tariff)}" href="${tariff.url}" target="_blank"><span class="${this.isMyTariff(tariff)?"":""}">${tariff.tariffName}</span></a><br>
            ${!price.featuring ? html`<label class="w3-margin-top w3-small ${this.isMyTariff(tariff)?"":""}">${tariff.provider}</label>`:""}`
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
    if(price.price==null) return this.noPriceAvailableTemplate(price);

    return html`
    <td class="cp-price-right">
      <label class="w3-right ${this.isMyTariff(tariff)?"":""}">${this.isMyTariff(tariff) ? html``:"" }${this.h().dec(price.price)}</label><br>
      ${price.price > 0 ?
        html`<label class="w3-right w3-small">${this.t("average")}: ${this.h().dec(price.pricePerKWh)}</label><br>`:""
      }
      <label class="w3-right w3-small">
        ${price.price > 0 ? this.t("per") : ""}
        ${[
          price.distribution.session ? `${(price.distribution.session < 1 ? this.h().perc(price.distribution.session) : "")} ${this.t("session")}` : null,
          price.distribution.kwh ? `${(price.distribution.kwh < 1 ? this.h().perc(price.distribution.kwh) : "")} kWh` : null,
          price.distribution.minute ? 
            `${(price.distribution.minute < 1 ? this.h().perc(price.distribution.minute) : "")} `+ 
            `min${price.blockingFeeStart ? ` (${this.blockingFeeTemplate(price)})` : ""}` : null,
          (price.distribution.minute == undefined || price.distribution.minute == 0) && price.blockingFeeStart ? this.blockingFeeTemplate(price) : null
        ].filter(t=>t).join(" + ")}
      </label>
    </td>
    `;
  }

  noPriceAvailableTemplate(price){
    return html`
    <td class="cp-price-right">
      <label class="w3-right">${this.t("priceUnavailable")}</label>
      <label class="w3-right w3-small">${price.noPriceReason}</label>
    </td>
    `;
  }
  
  blockingFeeTemplate(price){
    return this.sf(this.t("blockingFeeFrom"),this.h().time(price.blockingFeeStart));
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
          ${tag.url ? html`<a @click="${()=>this.onTagClicked(tag)}" href="${tag.url.replace("{locale}",this.translation.currentLocaleOrFallback())}" target="_blank">${tag.text}</a>` : tag.text}
        </label>
    `);
    return html`<div>${entries}</div>`
  }

  render(prices, myTariffs, station, root){
    this.myTariffs = myTariffs;
    const pricesForMyTariffs = prices.filter(p=>this.isMyTariff(p.tariff));
    const otherPrices = prices.filter(p=>!this.isMyTariff(p.tariff));
    const template = this.emptyPriceList(station,prices) ? this.template(pricesForMyTariffs, otherPrices) : "";
    render(template,this.getEl(root));
  }

  onManageMyTariffs(){
    this.sidebar.open("manageMyTariffs");
  }

  onAffiliateClicked(tariff){
    this.analytics.log('send', 'event', 'AffiliateEMP', tariff.url);
  }

  onTagClicked(tag){
    if(!tag.url) return;
    this.analytics.log('send', 'event', 'TagLink', tag.url);
  }

  emptyPriceList(station, prices){
    return !station.isFreeCharging && prices.length > 0 || prices.length > 0;
  }

  isMyTariff(tariff){
    return this.myTariffs.some(t=>t.id == tariff.tariff.id); 
  }
}

