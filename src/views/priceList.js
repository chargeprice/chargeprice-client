import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
import GroupPriceList from '../useCase/groupPriceList';
import FileUtils from '../helper/fileUtils';
import PriceCsvSerializer from '../helper/priceCsvSerializer';
import GenericPopup from '../modal/genericPopup';
var dayjs = require('dayjs');

export default class PriceListView extends ViewBase {
  constructor(depts,sidebar) {
    super(depts);
    this.analytics = depts.analytics();
    this.currency = depts.currency();
    this.sidebar = sidebar;

    this.theme = depts.themeLoader().getCurrentThemeConfig();
    this.filters = { noMonthlyFee: false, providerCustomerOnly: false };
  }

  template(){
    const prices = this.groupedPrices;
    const hasWallet = prices.allMyPrices.length > 0;
    const hasPrices = hasWallet || prices.allOtherPrices.length > 0;

    return html`
      ${hasPrices && this.options.isPro ? html`
        <div class="w3-container w3-padding">
          <label @click="${()=>this.onDownloadPrices()}" class="link-text"><i class="fas fa-download"></i> Download Price List</li>
        </div>
      `:""}

      ${this.priceSectionTemplate(()=>html`<a href="#" class="tariff-link" @click="${()=>this.onManageMyTariffs()}">${this.t("myTariffs")} <i class="fa fa-pencil"></a>`, prices.allMyPrices)}

      ${prices.allOtherPrices.length > 0 ? html`
        <div class="price-flex-container w3-margin-top price-header header-font">
          <div class="price-flex-left">${hasWallet ? this.t("otherTariffs") : html`<a href="#" class="tariff-link" @click="${()=>this.onManageMyTariffs()}">${this.t("tariff")} <i class="fa fa-pencil"></i></a>`}</div>
          <div class="price-flex-right">${this.currency.getDisplayedCurrency()}</div>
        </div>

        ${this.filterChipsTemplate()}

        ${this.rowsTemplate(this.applyFilters(prices.allOtherPrices))}
      `:""}

      ${hasPrices ? html`
        <div class="w3-margin-top w3-small w3-container">
          ${this.ut("totalPriceInfo")}
        </div>
      `:""}
    `;
  }

  filterChipsTemplate(){
    const chips = [
      { key: "noMonthlyFee", text: this.t("noMonthlyFee") },
      { key: "providerCustomerOnly", text: this.t("providerCustomerOnly"), info: this.t("providerCustomerFilterInfo") }
    ];

    return html`
      <div style="margin-left: 8px;">
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${chips.map(chip=>html`
            <span @click="${()=>this.onToggleFilter(chip.key)}" class="w3-tag w3-round cp-clickable ${this.filters[chip.key] ? "pc-secondary" : "w3-white w3-border"}" style="padding: 8px 14px; font-size: 15px;">
              ${this.filters[chip.key] ? html`<i class="fa fa-check"></i> `:""}${chip.text}
              ${chip.info ? html`<i @click="${(e)=>this.onShowFilterInfo(e,chip)}" class="fa fa-info-circle w3-margin-left"></i>`:""}
            </span>
          `)}
        </div>
      </div>
    `;
  }

  onShowFilterInfo(event, chip){
    event.stopPropagation();
    new GenericPopup(this.depts).show({header: chip.text, message: chip.info});
  }

  applyFilters(prices){
    return prices.filter(p=>{
      const tariff = p.tariff;
      if(this.filters.noMonthlyFee && !(tariff.totalMonthlyFee === 0 && tariff.monthlyMinSales === 0)) return false;
      if(this.filters.providerCustomerOnly && !tariff.providerCustomerTariff) return false;
      return true;
    });
  }

  onToggleFilter(key){
    this.filters[key] = !this.filters[key];
    this.rerender();
  }

  priceSectionTemplate(header, prices){
    if(prices.length==0) return "";

    return html`
      <div class="price-flex-container w3-margin-top price-header header-font">
        <div class="price-flex-left">${header()}</div>
        <div class="price-flex-right">${this.currency.getDisplayedCurrency()}</div>
      </div>

      ${this.rowsTemplate(prices)}
    `;
  }

  rowsTemplate(prices){
    return prices.map(p=>{
      const tariff = p.tariff;
      return html`
        <div class="price-flex-container price-row" style="${this.isHighlighted(tariff) ? `background: ${tariff.branding.background_color} !important; color: ${tariff.branding.text_color} !important;` : ""}" >
          ${this.tariffOverviewTemplate(p,tariff)}
          ${this.priceTemplate(p,tariff)}
        </div>
      `});
  }

  tariffOverviewTemplate(price,tariff){
    return html`
    <div class="price-flex-left">
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
      ${this.isHighlighted(tariff) ? html`
        <a href="${tariff.url}" target="_blank" class="w3-block"><img class="feature-logo" src="${tariff.branding.logo_url}"/></a>
      `:""}
      ${this.h().customConfig.isBeta() && tariff.links && tariff.links.open_app_at_station ?
        html`<br>
        <a href="${tariff.links.open_app_at_station}" class="w3-button w3-small w3-blue" target="_blank"><i class="fa fa-bolt"></i> Start Charging!</a> 
        `:""}
    </div>
    `;
  }

  priceTemplate(price,tariff){
    if(price.price==null) return this.noPriceAvailableTemplate(price);

    return html`
    <div class="price-flex-right">
      <label class="w3-right ${this.isMyTariff(tariff)?"":""}">${this.isMyTariff(tariff) ? html``:"" }${this.h().dec(price.pricePerKWh)} / kWh</label>
      ${this.timeFeeText(price) ? html`<br><label class="w3-right w3-small">${this.timeFeeText(price)}</label>`:""}
    </div>
    `;
  }

  noPriceAvailableTemplate(price){
    return html`
    <div class="price-flex-right">
      <label class="w3-right">${this.t("priceUnavailable")}</label>
      <label class="w3-right w3-small">${price.noPriceReason}</label>
    </div>
    `;
  }

  timeFeeText(price){
    if(price.blockingFeeStart == null) return "";
    if(price.blockingFeeStart === 0) return this.t("timeFeeFromStart");
    return this.sf(this.t("timeFeeAfter"),this.h().time(price.blockingFeeStart));
  }

  renderTags(tags, tariff){
    if(tags.length==0) return "";
    const colorMapping = {
      alert: "w3-deep-orange",
      info: "pc-secondary",
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

  render(prices, options, station, root ){
    this.myTariffs = options.myTariffs;
    this.station = station;
    this.root = root;
    this.rawPrices = prices;
    this.options = options;
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
    return tariff.directPayment || this.myTariffs.some(t=>t.id == tariff.tariff.id);
  }

  isHighlighted(tariff) {
    const highlightedIds = this.theme.highlightedTariffs;
    return tariff.branding && (!highlightedIds || highlightedIds.includes(tariff.tariff.id));
  }

  onDownloadPrices(){
    const csv =  new PriceCsvSerializer(this.rawPrices, this.station, this.options).serialize();
    const dateString = dayjs(new Date()).format("YYYY-MM-DD-HH-mm")
    new FileUtils().saveFileAsync(()=>csv, `price-export-${dateString}.csv`, "text/csv");
  }
}

