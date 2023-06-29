import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
import GroupPriceList from '../useCase/groupPriceList';

export default class PriceListView extends ViewBase {
  constructor(depts,sidebar) {
    super(depts);
    this.analytics = depts.analytics();
    this.currency = depts.currency();
    this.sidebar = sidebar;
    this.pricesInBestGroups = 3;

    this.theme = depts.themeLoader().getCurrentThemeConfig();
  }

  template(){
    let sections = [];
    const prices = this.groupedPrices;

    if(this.showAllPrices) {
      sections = [
        this.priceSectionTemplate(
          ()=>html`<i class="fa fa-star fav-icon"></i> <a href="#" class="tariff-link" @click="${()=>this.onManageMyTariffs()}">${this.t("myTariffs")} <i class="fa fa-pencil"></a>`, 
          prices.allMyPrices),
        this.priceSectionTemplate(
          ()=>prices.allMyPrices.length > 0 ? this.t("otherTariffs") : this.t("tariff"), 
          prices.allOtherPrices)
      ]
    }
    else {
      sections = [
        this.priceSectionTemplate(
          ()=>html`<i class="fa fa-star fav-icon"></i> <a href="#" class="tariff-link" @click="${()=>this.onManageMyTariffs()}">
            ${this.sf(this.t("bestMyTariffs"), this.pricesInBestGroups)} <i class="fa fa-pencil"></a>`, 
          prices.bestMyPrices),
        this.priceSectionTemplate(
          ()=>this.sf(this.t("bestTariffsWithoutMonthlyFee"), this.pricesInBestGroups), 
          prices.bestWithoutMonthlyFees),
        this.priceSectionTemplate(
          ()=>this.sf(this.t("bestTariffsWithMonthlyFee"), this.pricesInBestGroups), 
          prices.bestWithMonthlyFees),
        this.priceSectionTemplate(()=>this.t("promotedTariffs"),prices.promoted)
      ]
    }

    return html`
      ${sections}

      ${prices.morePricesCount > 0 ? html`
      <div class="w3-margin-top w3-container">
        <button @click="${()=>this.onToggleShowAllPrices()}" class="w3-button pc-main">
          ${this.showAllPrices ? this.t("backToPriceOverview") : this.t("viewAllPrices")}
        </button>
      </div>`:""}

      <div class="w3-margin-top w3-small w3-container">
        ${this.ut("totalPriceInfo")}
      </div>
    `;
  }

  priceSectionTemplate(header, prices){
    if(prices.length==0) return "";

    return html`<table class="w3-table w3-striped w3-margin-top">
      <tr>
        <th width="60%">${header()}</th>
        <th class="w3-right cp-price-right">${this.currency.getDisplayedCurrency()}</th>
      </tr>
      <tbody>
        ${this.rowsTemplate(prices)}
      </tbody>
    </table>
    `;
  }

  rowsTemplate(prices){
    return prices.map(p=>{
      const tariff = p.tariff;
      return html`
      <tr style="${this.isHighlighted(tariff) ? `background: ${tariff.branding.background_color} !important; color: ${tariff.branding.text_color} !important;` : ""}" >
        ${this.tariffOverviewTemplate(p,tariff)}
        ${this.priceTemplate(p,tariff)}
      </tr>
    `});
  }

  tariffOverviewTemplate(price,tariff){
    return html`
    <td class="cp-price-left">
      ${tariff.tariffName == null || tariff.tariffName == tariff.provider ?
        html`<a class="tariff-link" @click="${()=>this.onAffiliateClicked(tariff)}" href="${tariff.url}" target="_blank" style="${this.isHighlighted(tariff) ? `border-bottom-color: ${tariff.branding.text_color};`:""}"><span class="${this.isMyTariff(tariff)?"":""}">${tariff.provider}</span></a>` :
        html`<a class="tariff-link" @click="${()=>this.onAffiliateClicked(tariff)}" href="${tariff.url}" target="_blank" style="${this.isHighlighted(tariff) ? `border-bottom-color: ${tariff.branding.text_color};`:""}"><span class="${this.isMyTariff(tariff)?"":""}">${tariff.tariffName}</span></a><br>
            ${!this.isHighlighted(tariff) ? html`<label class="w3-margin-top w3-small ${this.isMyTariff(tariff)?"":""}">${tariff.provider}</label>`:""}`
      }
      ${this.renderTags(price.tariff.tags, tariff)}
      ${tariff.totalMonthlyFee > 0 || tariff.monthlyMinSales > 0 ?
        html`
          <label class=" w3-small w3-block">
          ${tariff.totalMonthlyFee > 0 ? `${this.t("baseFee")}: ${this.h().dec(tariff.totalMonthlyFee)}/${this.t("month")}**`:"" }
          ${tariff.monthlyMinSales > 0 ? `${this.t("minSales")}: ${this.h().dec(tariff.monthlyMinSales)}/${this.t("month")}`:"" }
          </label>
        `:""}
      ${tariff.providerCustomerTariff ?
        html`
          <label class="w3-small w3-block">${this.t("providerCustomerOnly")}</label> 
        `:""}
      ${this.isHighlighted(tariff) ? html`
        <a href="${tariff.url}" target="_blank" class="w3-block"><img class="feature-logo" src="${tariff.branding.logo_url}"/></a>
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
      <label class="w3-right ${this.isMyTariff(tariff)?"":""}">${this.isMyTariff(tariff) ? html``:"" }${this.h().dec(price.price)}</label>
      
      ${this.showPriceDetails ? this.priceDetailsTemplate(price) : ""}
    </td>
    `;
  }

  priceDetailsTemplate(price){
    return html`
      <br>
      ${price.price > 0 ?
        html`<label class="w3-right w3-small">${this.t("average")} ${this.h().dec(price.pricePerKWh)}</label><br>`:""
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
    `
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

  renderTags(tags, tariff){
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
          ${tag.url ? html`<a @click="${()=>this.onTagClicked(tag, tariff)}" href="${tag.url.replace("{locale}",this.translation.currentLocaleOrFallback())}" target="_blank">${tag.text}</a>` : tag.text}
        </label>
    `);
    return html`<div>${entries}</div>`
  }

  render(prices, options, station, root){
    this.myTariffs = options.myTariffs;
    this.station = station;
    this.root = root;
    this.showPriceDetails = options.showPriceDetails;
    this.showAllPrices = false;
    this.groupedPrices = this.groupIntoSections(prices);
    this.rerender();
  }

  rerender(){
    render(this.isPriceListEmpty() ? this.template() : "",this.getEl(this.root));
  }

  groupIntoSections(prices){
    return new GroupPriceList(this.depts, 
      prices, this.myTariffs, this.theme.highlightedTariffs, this.pricesInBestGroups).run();
  }

  onToggleShowAllPrices(){
    this.showAllPrices = !this.showAllPrices;
    this.analytics.log('event', 'price_list_type_changed', { type: this.showAllPrices ? "all_prices" : "grouped_prices" });
    this.rerender();
  }

  onManageMyTariffs(){
    this.sidebar.showMyTariffs();
  }

  onAffiliateClicked(tariff){
    this.analytics.log('event', 'affiliate_emp_clicked',{
      emp_name: tariff.provider,
      tariff_name: tariff.tariffName
    });
  }

  onTagClicked(tag, tariff){
    if(!tag.url) return;

    this.analytics.log('event', 'emp_tag_clicked',{
      emp_name: tariff.provider,
      tariff_name: tariff.tariffName,
      tag_url: tag.url
    });
  }

  isPriceListEmpty(){
    const pricesAvailable = this.groupedPrices.allPrices.length > 0;
    return !this.station.isFreeCharging && pricesAvailable || pricesAvailable;
  }

  isMyTariff(tariff){
    return this.myTariffs.some(t=>t.id == tariff.tariff.id); 
  }

  isHighlighted(tariff) {
    const highlightedIds = this.theme.highlightedTariffs;
    return tariff.branding && (!highlightedIds || highlightedIds.includes(tariff.tariff.id));
  }
}

