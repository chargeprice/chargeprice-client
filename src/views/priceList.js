import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
import GroupPriceList from '../useCase/groupPriceList';
import FileUtils from '../helper/fileUtils';
import PriceCsvSerializer from '../helper/priceCsvSerializer';
import GenericPopup from '../modal/genericPopup';
import StationTariffs from '../repository/station_tariffs';
import Advertisements from '../repository/advertisements';
import BannerAd from '../component/bannerAd';
import AppUpsellBanner from '../component/appUpsellBanner';
var dayjs = require('dayjs');

// Energy price always comes first
const DIMENSION_ORDER = ["kwh", "session", "minute", "parking_minute"];
const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
// The banner ad (free version) is shown after this many prices
const AD_AFTER_ROWS = 3;

// A new view is created for every price update, only the latest one may render async results
let activeView = null;

// Promoted tariffs are tracked once per station open (see Sidebar.stationOpenId), over all views
const trackedPromotedTariffs = { stationOpenId: null, tariffIds: new Set() };
let promotedTariffObserver = null;
// The price list is rendered several times per station open, the ad counts as displayed once
let adDisplayedForStationOpenId = null;

export default class PriceListView extends ViewBase {
  constructor(depts,sidebar) {
    super(depts);
    this.analytics = depts.analytics();
    this.currency = depts.currency();
    this.sidebar = sidebar;
    this.premiumGate = sidebar.premiumGate;
    this.appUpsellBanner = new AppUpsellBanner(depts, this.premiumGate);

    this.theme = depts.themeLoader().getCurrentThemeConfig();
    this.filters = { noMonthlyFee: false, providerCustomerTariffs: false };
    this.expandedTariffIds = [];
    this.tariffDetails = {};
    this.adsRepo = new Advertisements(depts);
    this.bannerAd = new BannerAd(depts, this.premiumGate);
    this.ad = null;
  }

  template(){
    const prices = this.groupedPrices;
    const hasWallet = prices.allMyPrices.length > 0;
    const hasPrices = hasWallet || prices.allOtherPrices.length > 0;
    this.renderedRows = 0;
    this.adShown = false;

    return html`
      ${hasPrices && this.options.isPro ? html`
        <div class="w3-container w3-padding">
          <label @click="${()=>this.onDownloadPrices()}" class="link-text"><i class="fas fa-download"></i> Download Price List</li>
        </div>
      `:""}

      ${this.priceSectionTemplate(()=>html`<a href="#" class="tariff-link" @click="${(e)=>{e.preventDefault(); this.onManageMyTariffs();}}">${this.t("myTariffs")} <i class="fa fa-pencil"></i>${this.premiumStarTemplate()}</a>`, prices.allMyPrices)}

      ${prices.allOtherPrices.length > 0 ? html`
        <div class="price-flex-container w3-margin-top price-header header-font">
          <div class="price-flex-left">${hasWallet ? this.t("otherTariffs") : html`<a href="#" class="tariff-link" @click="${(e)=>{e.preventDefault(); this.onManageMyTariffs();}}">${this.t("tariff")} <i class="fa fa-pencil"></i>${this.premiumStarTemplate()}</a>`}</div>
          <div class="price-flex-right">${this.priceHeaderTemplate()}</div>
        </div>

        ${!this.premiumGate.isRestricted() ? this.filterChipsTemplate() : ""}

        ${prices.allOtherPrices.some(p=>this.isLocked(p.tariff)) ? this.premiumBannerTemplate() : ""}

        ${this.rowsTemplate(this.applyFilters(prices.allOtherPrices))}
      `:""}

      ${hasPrices && this.ad && !this.adShown ? this.priceListAdTemplate() : ""}

    `;
  }

  premiumStarTemplate(){
    return this.premiumGate.isRestricted() ? html` <i class="fa fa-star premium-star-inline"></i>` : "";
  }

  premiumBannerTemplate(){
    return this.appUpsellBanner.template({ title: this.t("premiumBannerAppTitle"), source: "price_list_banner" });
  }

  // The prices are effective prices per kWh (total cost of the session / charged energy)
  priceHeaderTemplate(){
    return html`
      <span class="price-header-unit">
        ${this.t("priceListAvgPriceHeader")} (${this.currency.getDisplayedCurrency()})
        <i class="fa fa-info-circle cp-clickable price-header-info" @click="${(e)=>this.onShowAvgPriceInfo(e)}"></i>
      </span>
    `;
  }

  onShowTotalCostInfo(event){
    event.stopPropagation();
    new GenericPopup(this.depts).show({ header: this.t("tariffDetailsTotal"), message: this.t("tariffDetailsTotalInfo"), narrow: true });
  }

  onShowAvgPriceInfo(event){
    event.stopPropagation();
    new GenericPopup(this.depts).show({ header: this.t("priceListAvgPriceHeader"), message: this.t("priceListAvgPriceInfo"), narrow: true });
  }

  filterChipsTemplate(){
    const chips = [
      { key: "noMonthlyFee", text: this.t("onlyTariffsWithoutMonthlyFees") },
      { key: "providerCustomerTariffs", text: this.t("providerCustomerOnly"), info: this.t("providerCustomerFilterInfo") }
    ];

    return html`
      <div class="price-filter-chips">
        <i class="fa fa-filter price-filter-icon"></i>
        ${chips.map(chip=>html`
          <span @click="${()=>this.onToggleFilter(chip.key)}" class="w3-tag w3-round cp-clickable price-filter-chip ${this.filters[chip.key] ? "pc-secondary" : "w3-white w3-border"}">
            ${this.filters[chip.key] ? html`<i class="fa fa-check"></i> `:""}${chip.text}
            ${chip.info ? html`<i @click="${(e)=>this.onShowFilterInfo(e,chip)}" class="fa fa-info-circle price-filter-info"></i>`:""}
          </span>
        `)}
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
      // Provider customer tariffs are hidden unless the filter is active
      if(!this.filters.providerCustomerTariffs && tariff.providerCustomerTariff) return false;
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
        <div class="price-flex-right">${this.priceHeaderTemplate()}</div>
      </div>

      ${this.rowsTemplate(prices)}
    `;
  }

  rowsTemplate(prices){
    return prices.map(p=>html`${this.rowTemplate(p)}${this.adAfterRowTemplate()}`);
  }

  // Counts the rendered rows across all sections, the ad comes after the AD_AFTER_ROWS-th price
  adAfterRowTemplate(){
    this.renderedRows++;
    if(!this.ad || this.adShown || this.renderedRows != AD_AFTER_ROWS) return "";
    return this.priceListAdTemplate();
  }

  priceListAdTemplate(){
    this.adShown = true;
    return html`<div class="price-list-ad">${this.bannerAd.template(this.ad)}</div>`;
  }

  async loadAd(){
    const ad = await this.adsRepo.bannerFor(this.station.country, "price_list1");
    if(!ad || activeView !== this) return;

    this.ad = ad;
    this.rerender();
    if(this.groupedPrices.allPrices.length > 0 && adDisplayedForStationOpenId !== this.sidebar.stationOpenId){
      adDisplayedForStationOpenId = this.sidebar.stationOpenId;
      this.adsRepo.trackDisplay(ad);
    }
  }

  rowTemplate(p){
    const tariff = p.tariff;
    if(this.isLocked(tariff)) return this.lockedRowTemplate(p, tariff);
    const expanded = this.expandedTariffIds.includes(tariff.tariff.id);
    return html`
      <div class="price-row price-row-expandable cp-clickable" data-promoted-tariff-id="${this.isHighlighted(tariff) ? tariff.tariff.id : ""}" data-emp-name="${tariff.provider}" @click="${()=>this.onToggleTariff(tariff)}" style="${this.isHighlighted(tariff) ? `background: ${tariff.branding.background_color} !important; color: ${tariff.branding.text_color} !important;` : ""}" >
        <div class="price-flex-container">
          ${this.tariffOverviewTemplate(p,tariff)}
          ${this.priceTemplate(p,tariff)}
          <i class="fa fa-chevron-${expanded ? "up" : "down"} price-row-toggle"></i>
        </div>
        ${expanded ? this.tariffDetailsTemplate(tariff, p) : ""}
      </div>
    `;
  }

  // Tariff name and tags are hidden, the price stays visible. The real name isn't rendered
  // at all, so it can't be read from the DOM.
  lockedRowTemplate(price, tariff){
    const name = tariff.tariffName == null || tariff.tariffName == tariff.provider ? tariff.provider : tariff.tariffName;
    const showProvider = tariff.tariffName != null && tariff.tariffName != tariff.provider;

    return html`
      <div class="price-flex-container price-row price-row-locked cp-clickable" @click="${()=>this.onLockedTariffClicked()}">
        <div class="price-flex-left">
          <span class="price-locked-text"><i class="fa fa-lock"></i> <span class="price-locked-blur">${this.scramble(name)}</span></span>
          ${showProvider ? html`<br><label class="w3-margin-top w3-small price-locked-blur">${this.scramble(tariff.provider)}</label>`:""}
          ${tariff.totalMonthlyFee > 0 || tariff.monthlyMinSales > 0 ?
            html`
              <label class=" w3-small w3-block">
              ${tariff.totalMonthlyFee > 0 ? `${this.t("baseFee")}: ${this.h().dec(tariff.totalMonthlyFee)}/${this.t("month")}`:"" }
              ${tariff.monthlyMinSales > 0 ? `${this.t("minSales")}: ${this.h().dec(tariff.monthlyMinSales)}/${this.t("month")}`:"" }
              </label>
            `:""}
        </div>
        ${this.priceTemplate(price,tariff)}
      </div>
    `;
  }

  scramble(text){
    return (text || "").replace(/\p{Lu}/gu, "X").replace(/\p{Ll}/gu, "x").replace(/\d/g, "0");
  }

  tariffOverviewTemplate(price,tariff){
    return html`
    <div class="price-flex-left">
      ${tariff.tariffName == null || tariff.tariffName == tariff.provider ?
        html`<span class="tariff-name">${tariff.provider}</span>` :
        html`<span class="tariff-name">${tariff.tariffName}</span><br>
            ${!this.isHighlighted(tariff) ? html`<label class="w3-margin-top w3-small">${tariff.provider}</label>`:""}`
      }
      ${this.renderTags(price.tariff.tags, tariff)}
      ${tariff.totalMonthlyFee > 0 || tariff.monthlyMinSales > 0 ?
        html`
          <label class=" w3-small w3-block">
          ${tariff.totalMonthlyFee > 0 ? `${this.t("baseFee")}: ${this.h().dec(tariff.totalMonthlyFee)}/${this.t("month")}`:"" }
          ${tariff.monthlyMinSales > 0 ? `${this.t("minSales")}: ${this.h().dec(tariff.monthlyMinSales)}/${this.t("month")}`:"" }
          </label>
        `:""}
      ${this.isHighlighted(tariff) ? html`
        <a href="${tariff.url}" target="_blank" class="w3-block" @click="${(e)=>{e.stopPropagation(); this.onAffiliateClicked(tariff);}}"><img class="feature-logo" src="${tariff.branding.logo_url}"/></a>
      `:""}
      ${this.h().customConfig.isBeta() && tariff.links && tariff.links.open_app_at_station ?
        html`<br>
        <a href="${tariff.links.open_app_at_station}" class="w3-button w3-small w3-blue" target="_blank" @click="${(e)=>e.stopPropagation()}"><i class="fa fa-bolt"></i> Start Charging!</a> 
        `:""}
    </div>
    `;
  }

  tariffDetailsTemplate(tariff, price){
    const details = this.tariffDetails[tariff.tariff.id] || { loading: true };

    let content;
    if(details.loading) content = html`<div class="w3-center"><i class="fa fa-spinner fa-spin"></i></div>`;
    else if(details.error) content = html`<div class="w3-small">${this.t("tariffDetailsError")}</div>`;
    else if(details.segments.length == 0) content = html`<div class="w3-small">${this.t("tariffDetailsNoPrices")}</div>`;
    else content = details.segments.map(segment=>this.segmentTemplate(segment));

    return html`
      <div class="tariff-details" @click="${(e)=>e.stopPropagation()}">
        ${content}
        ${this.totalCostTemplate(price)}
        <div class="tariff-details-links">
          ${tariff.url ? html`
            <a href="${tariff.url}" target="_blank" class="w3-btn pc-secondary w3-small w3-round tariff-details-website" @click="${()=>this.onAffiliateClicked(tariff)}">
              ${this.t("tariffDetailsWebsite")} <i class="fa fa-external-link"></i>
            </a>
          `:""}
          ${!this.premiumGate.isRestricted() && this.options.chargePoint ? html`
            <a href="#" class="link-text w3-small" @click="${(e)=>{e.preventDefault(); this.sidebar.feedback.wrongPrice(this.station, this.options.chargePoint, tariff.tariff.id);}}">
              ${this.t("fbReportWrongPriceHeader")}
            </a>
          `:""}
        </div>
        ${tariff.url ? html`<div class="tariff-details-disclosure">${this.t("affiliateDisclosure")}</div>` : ""}
      </div>
    `;
  }

  // Total of the simulated session, as calculated by the charge_prices API
  totalCostTemplate(price){
    if(price.price == null) return "";
    const energy = this.options.chargePointEnergy;
    const duration = this.options.chargePointDuration;

    return html`
      <div class="tariff-details-row tariff-details-total">
        <div>
          ${this.t("tariffDetailsTotal")}
          <i class="fa fa-info-circle cp-clickable price-header-info" @click="${(e)=>this.onShowTotalCostInfo(e)}"></i>
          ${energy && duration ? html`<div class="w3-small tariff-details-condition">${this.h().int(energy)} kWh · ${this.h().time(duration)}</div>` : ""}
        </div>
        <div class="tariff-details-price">${this.h().dec(price.price)} ${this.currency.getDisplayedCurrency()}</div>
      </div>
    `;
  }

  segmentTemplate(segment){
    const conditions = this.segmentConditions(segment);
    return html`
      <div class="tariff-details-row">
        <div>
          ${this.t(`tariffDetails_${segment.dimension}`)}
          ${conditions ? html`<div class="w3-small tariff-details-condition">${conditions}</div>` : ""}
        </div>
        <div class="tariff-details-price">${this.segmentPrice(segment)}</div>
      </div>
    `;
  }

  segmentPrice(segment){
    const units = { kwh: " / kWh", minute: " / min", parking_minute: " / min", session: "" };
    // Some time based prices have more than 2 decimals (e.g. 0.035/min)
    const cents = segment.price * 100;
    const digits = Math.abs(cents - Math.round(cents)) > 1e-9 ? 3 : 2;
    return `${segment.price.toFixed(digits)} ${segment.currency || ""}${units[segment.dimension] || ""}`;
  }

  segmentConditions(segment){
    const conditions = [];
    const isTime = segment.dimension == "minute" || segment.dimension == "parking_minute";
    const formatRange = value => isTime ? this.h().time(value) : `${value} kWh`;
    const from = segment.range_gte || 0;
    const to = segment.range_lt;

    if(segment.dimension != "session"){
      if(from > 0 && to != null) conditions.push(`${formatRange(from)} – ${formatRange(to)}`);
      else if(from > 0) conditions.push(this.sf(this.t("tariffDetailsAfter"), formatRange(from)));
      else if(to != null) conditions.push(this.sf(this.t("tariffDetailsFirst"), formatRange(to)));
    }

    if(segment.time_of_day_start != null && segment.time_of_day_end != null){
      conditions.push(`${this.h().timeOfDay(segment.time_of_day_start)} – ${this.h().timeOfDay(segment.time_of_day_end)}`);
    }

    if(segment.weekdays && segment.weekdays.length > 0){
      const formatter = new Intl.DateTimeFormat(this.translation.currentLocaleOrFallback(), { weekday: "short" });
      // 1 Jan 2024 was a Monday
      conditions.push(segment.weekdays.map(day=>formatter.format(new Date(2024, 0, 1 + WEEKDAYS.indexOf(day)))).join(", "));
    }

    const occupancyFrom = segment.occupancy_gte;
    const occupancyTo = segment.occupancy_lt;
    if(occupancyFrom != null || occupancyTo != null){
      let range;
      if(occupancyFrom != null && occupancyTo != null) range = `${occupancyFrom}–${occupancyTo}%`;
      else if(occupancyFrom != null) range = `≥ ${occupancyFrom}%`;
      else range = `< ${occupancyTo}%`;
      conditions.push(this.sf(this.t("tariffDetailsOccupancy"), range));
    }

    // Small increments (e.g. per second or per 0.01 kWh) aren't worth mentioning
    if(isTime && segment.billing_increment >= 1){
      conditions.push(this.sf(this.t("tariffDetailsBillingIncrement"), this.h().time(segment.billing_increment)));
    }

    return conditions.join(" · ");
  }

  async onToggleTariff(tariff){
    const tariffId = tariff.tariff.id;

    if(this.expandedTariffIds.includes(tariffId)){
      this.expandedTariffIds = this.expandedTariffIds.filter(id=>id != tariffId);
      this.rerender();
      return;
    }

    this.expandedTariffIds = this.expandedTariffIds.concat([tariffId]);
    this.analytics.log('event', 'tariff_details_opened', { emp_name: tariff.provider, tariff_name: tariff.tariffName });

    const details = this.tariffDetails[tariffId];
    if(details && !details.error){
      this.rerender();
      return;
    }

    const chargePoint = this.options.chargePoint;
    if(!chargePoint){
      this.tariffDetails[tariffId] = { segments: [] };
      this.rerender();
      return;
    }

    this.tariffDetails[tariffId] = { loading: true };
    this.rerender();

    try {
      const result = await new StationTariffs(this.depts).getTariffDetails(this.station.id, chargePoint, tariffId);
      this.tariffDetails[tariffId] = { segments: this.sortSegments(result.segments) };
    }
    catch(ex){
      console.error(ex);
      this.tariffDetails[tariffId] = { error: true };
    }

    if(activeView === this) this.rerender();
  }

  sortSegments(segments){
    const order = segment => {
      const idx = DIMENSION_ORDER.indexOf(segment.dimension);
      return idx == -1 ? DIMENSION_ORDER.length : idx;
    };
    return segments.slice().sort((a,b)=>
      order(a) - order(b) ||
      (a.range_gte || 0) - (b.range_gte || 0) ||
      (a.time_of_day_start || 0) - (b.time_of_day_start || 0)
    );
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
    const iconFor = tag => tag.kind == "info" && tag.url ? "external-link" : iconMapping[tag.kind];
    const entries = tags.map(tag=>
      html`
        <span class="${ `w3-tag w3-small cp-margin-top-right-small ${colorMapping[tag.kind]}`}"><label><i class="${`fa fa-${iconFor(tag)}`}"></i>
          ${tag.url ? html`<a @click="${(e)=>{e.stopPropagation(); this.onTagClicked(tag, tariff);}}" href="${tag.url.replace("{locale}",this.translation.currentLocaleOrFallback())}" target="_blank">${tag.text}</a>` : tag.text}
        </label>
    `);
    return html`<div>${entries}</div>`
  }

  render(prices, options, station, root ){
    activeView = this;
    // The wallet is a premium feature, so free users only see ad-hoc prices in it
    this.myTariffs = this.premiumGate.isRestricted() ? [] : options.myTariffs;
    this.station = station;
    this.root = root;
    this.rawPrices = prices;
    this.options = options;
    this.groupedPrices = this.groupIntoSections(prices);
    this.rerender();

    // Ads are only shown in the free version
    if(this.premiumGate.isRestricted()) this.loadAd();
  }

  rerender(){
    render(this.isPriceListEmpty() ? this.template() : "",this.getEl(this.root));
    this.observePromotedTariffs();
  }

  // Logs promoted tariffs once they are actually visible (at least half of the row)
  observePromotedTariffs(){
    if(promotedTariffObserver) promotedTariffObserver.disconnect();
    if(typeof IntersectionObserver == "undefined") return;

    const stationOpenId = this.sidebar.stationOpenId;
    if(trackedPromotedTariffs.stationOpenId !== stationOpenId){
      trackedPromotedTariffs.stationOpenId = stationOpenId;
      trackedPromotedTariffs.tariffIds = new Set();
    }

    const rows = [...this.getEl(this.root).querySelectorAll("[data-promoted-tariff-id]")]
      .filter(row=>row.dataset.promotedTariffId && !trackedPromotedTariffs.tariffIds.has(row.dataset.promotedTariffId));
    if(rows.length == 0) return;

    promotedTariffObserver = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        const tariffId = entry.target.dataset.promotedTariffId;
        promotedTariffObserver.unobserve(entry.target);
        if(trackedPromotedTariffs.tariffIds.has(tariffId)) return;

        trackedPromotedTariffs.tariffIds.add(tariffId);
        this.analytics.log('event', 'tariff_displayed', { emp_name: entry.target.dataset.empName, tariff_id: tariffId });
      });
    }, { threshold: 0.5 });

    rows.forEach(row=>promotedTariffObserver.observe(row));
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

  // Ad-hoc prices and promoted partner tariffs are always visible
  isLocked(tariff){
    return this.premiumGate.isRestricted() && !tariff.directPayment && !this.isHighlighted(tariff);
  }

  onLockedTariffClicked(){
    this.premiumGate.showPremiumScreen("locked_tariff");
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

