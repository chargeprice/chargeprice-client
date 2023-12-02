import ViewBase from './viewBase';
import StartTimeSelection from '../modal/startTimeSelection';
import {html, render} from 'lit-html';
import RepositoryStartTime from '../repository/settings/startTime';
import ModalFeedback from '../modal/feedback';
import ModelThgInfo from '../modal/thgInfo';
import PriceListView from '../views/priceList';
import StationDetailsView from '../views/stationDetails';
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';

export default class StationPrices extends ViewBase{
  constructor(sidebar,depts) {
    super(depts);
    this.sidebar = sidebar;
    this.analytics = depts.analytics();
    this.slider = null;
    this.defaultBatteryRange = [20,80];
    this.startTimeRepo = new RepositoryStartTime();
    this.currentChargePoint = null;
    this.chargePointsSortedByPower = []
    this.themeLoader = depts.themeLoader();
    this.settingsPrimitive = depts.settingsPrimitive();
    this.thgCountries = [{ code: "AT", altCode: "Österreich"},{ code: "DE", altCode: "Deutschland"}];

    this.adBanners = [
      {
        bannerImageUrl: "/img/partners/and_charge_FR.png",
        ctaUrl: "https://kylomtr.me/ln/BgCMQ",
        countries: ["FR"],
        partner: "andcharge",
        isHidden: () => false
      },
      {
        bannerImageUrl: "/img/partners/thg_DE.png",
        customAction: ()=> this.onThg("DE"),
        countries: [],
        partner: "geldfuereauto",
        isHidden: ()=>this.settingsPrimitive.getBoolean("thgBannerHidden",false)
      },
      {
        bannerImageUrl: "/img/partners/thg_AT.jpg",
        customAction: ()=> this.onThg("AT"),
        countries: ["AT","Österreich"],
        partner: "instadrive_thg",
        isHidden: ()=>this.settingsPrimitive.getBoolean("thgBannerHidden",false)
      }
    ]

    this.initSlider();
  }

  batteryRangeInfoTempl(obj){
    return this.sf(this.t("batteryRangeInfo"),obj.from,obj.to);
  }

  parameterNoteTempl(obj){
    return html`
      <span class="w3-left">
        <i class="fa fa-clock-o"></i> 
          <span class="link-text" @click="${()=>this.selectStartTime()}">${this.h().timeOfDay(this.getStartTime())}</span> 
          <i class="fa fa-angle-right"></i> ~${this.h().timeOfDay(this.getEndTime(obj.chargePointDuration))}
          <br>
        (${this.h().time(obj.chargePointDuration)})*
        
      </span>
      <span class="w3-right">
        <i class="fa fa-bolt"></i>
        ${this.h().int(obj.chargePointEnergy)} kWh 
        (ø ${this.h().power(obj.chargePointEnergy*60/obj.chargePointDuration)} kW)*
      </span>
    `;
  }

  currentChargePointTemplate(){
    const obj = this.currentChargePoint;
    if(!obj)return "";
    return this.chargePointsSortedByPower.map(cp=> html`
      <span @click="${()=>this.onChargePointChanged(cp)}" class="cp-button ${cp == obj ? "pc-main" : "w3-light-gray"} w3-margin-top w3-margin-bottom ${cp.supportedByVehicle ? "": "w3-disabled"}">
        <label>${cp.power} kW</label><br>
        <label class="w3-small">${this.h().upper(cp.plug)} ${this.availabilityTextTemplate(cp) }</label>
        
      </span>
    `);
  }

  availabilityTextTemplate(chargePoint){
    if(chargePoint.availableCount == null) return `${chargePoint.count}x`;

    const countText = `${chargePoint.availableCount}\/${chargePoint.count}`;
    const color = chargePoint.availableCount == 0 ? "w3-red" : "w3-green";
    
    return html`<span class="w3-tag ${color}">${countText}</span>`;
  }

  feedbackTemplate(context){
    return html`
      <label class="w3-block" >${this.t("fbReportPriceText")}</label>
      <button @click="${()=>this.onReportPrice("missing_price",context)}" class="w3-btn pc-secondary">
      ${this.t("fbReportMissing")}
      </button>
      <button @click="${()=>this.onReportPrice("wrong_price",context)}" class="w3-btn pc-secondary">
        ${this.t("fbReportWrong")}
      </button>
    `;
  }

  stationPriceGeneralInfoTemplate(station, prices){
    if(!station.isFreeCharging && prices.length == 0){
      return html`<label class="w3-tag w3-light-blue-grey w3-margin-top"><i class="fa fa-info"></i> ${this.t("noTariffAvailable")}</label>`;
    }
    else if(station.isFreeCharging && prices.length > 0 && prices.some(p=>p.price > 0)) {
      return html`<label class="w3-tag w3-pale-red w3-margin-top"><i class="fa fa-exclamation"></i> ${this.t("freeStationWithPricesInfo")}</label>`;
    }
    else return "";
  }

  adBannerTemplate(station,options){
    const country = station.country;
    const currentBanner = this.adBanners.find(b => b.countries.includes(country));
    if(currentBanner == null || currentBanner.isHidden() || !this.themeLoader.isDefaultTheme() || options.isPro) return html``;

    this.analytics.log('event', 'ad_banner_displayed', { partner: currentBanner.partner, country: country});
    const action = currentBanner.customAction || (()=> this.onAdBannerClicked(currentBanner, country));

    return html`
      <div class="w3-row w3-margin-top">
        <a href="#" @click="${()=>action()}"><img src="${currentBanner.bannerImageUrl}" style="width: 100%;"/></a>
      </div>
    `;
  }

  initSlider(){
    this.slider = document.getElementById('batteryRange');

    noUiSlider.create(this.slider, {
        start: this.getStoredOrDefaultBatteryRange(),
        step: 1,
        margin: 1,
        connect: true,
        range: { min: 0,max: 100 }
    });

    this.updateBatteryRangeInfo();
    this.slider.noUiSlider.on('update', ()=>this.updateBatteryRangeInfo());
    this.slider.noUiSlider.on('end', ()=>{
      this.storeBatteryRange();
      const range = this.getBatteryRange();

      this.analytics.log('event', 'battery_changed',{
        percentage_start: range[0],
        percentage_end: range[1]
      });

      this.batteryChangedCallback()
    });
  }

  getBatteryRange(){
    return this.slider.noUiSlider.get().map(v=>parseInt(v));
  }

  updateBatteryRangeInfo(){
    const range = this.getBatteryRange();
    render(this.batteryRangeInfoTempl({from: range[0], to: range[1]}),this.getEl("batteryRangeInfo"));
  }

  showStation(station){
    this.chargePointsSortedByPower = this.sortChargePointsByPower(station.chargePoints);
    this.currentChargePoint = this.chargePointsSortedByPower[0];
    this.renderCurrentChargePointTemplate();
    this.selectedChargePointChangedCallback();
  }

  renderCurrentChargePointTemplate(){
    render(this.currentChargePointTemplate(),document.getElementById("select-charge-point"));
  }

  onChargePointChanged(value){
    if(!value.supportedByVehicle) return;
    this.currentChargePoint = value;
    this.renderCurrentChargePointTemplate();
    if(this.selectedChargePointChangedCallback) this.selectedChargePointChangedCallback(value);
  }
 
  updateStationPrice(station,prices,options){
    new StationDetailsView(this.depts).render(station,"station-info");
    render(this.parameterNoteTempl(options),this.getEl("parameterNote"));

    const sortedPrices = prices.sort((a,b)=>this.sortPrice(a.price, b.price));
    new PriceListView(this.depts,this.sidebar).render(sortedPrices, options, station, "prices")
    render(this.stationPriceGeneralInfoTemplate(station, prices),this.getEl("priceInfo"))
    render(this.feedbackTemplate({options: options, station: station, prices: sortedPrices}),this.getEl("priceFeedback")); 
    render(this.adBannerTemplate(station, options), this.getEl("adBanner"));
  }

  sortChargePointsByPower(chargePoints) {
    return chargePoints.sort((a,b)=>{
      const b1 = b.supportedByVehicle;
      const a1 = a.supportedByVehicle;

      if(b1 == a1) return (b.power-a.power);
      else return b1 - a1;
    });
  }

  sortPrice(a,b){
    if(a!=null && b!=null) return a - b;
    if(a==null && b!=null) return 1;
    if(b==null && a!=null) return -1;
    return 0;
  }

  onBatteryRangeChanged(callback){
    this.batteryChangedCallback = callback;
  }

  onThg(country){
    this.analytics.log('event', 'thg_info_open', {
      country: country
    });

    new ModelThgInfo(this.depts).show(country);
  }

  storeBatteryRange(){
    localStorage.setItem("batteryRange",JSON.stringify(this.getBatteryRange()));
  }

  onAdBannerClicked(banner, country){
    this.analytics.log('event', 'ad_banner_clicked', { partner: banner.partner, country: country});

    window.open(banner.ctaUrl, '_blank');
  }
  
  getStoredOrDefaultBatteryRange(){
    if(localStorage.getItem("batteryRange")){
      return JSON.parse(localStorage.getItem("batteryRange"));
    }
    else return this.defaultBatteryRange;
  }

  onStartTimeChanged(callback){
    this.startTimeChangedCallback = callback;
  }

  onSelectedChargePointChanged(callback){
    this.selectedChargePointChangedCallback=callback;
  }

  onReportPrice(type, context){
    const opts = context.options;
    const contextString = [
      `${opts.myVehicle.brand} ${opts.myVehicle.name}`,
      `Battery: ${this.getBatteryRange()}`,
      `${this.currentChargePoint.plug} ${this.currentChargePoint.power} kw`,
      opts.displayedCurrency
    ].join(", ")

    const options = {
      cpo: context.station.network,
      poiLink: window.location.href,
      prices: context.prices,
      context: contextString
    }

    new ModalFeedback(this.depts).show(type,options);
  }

  getStartTime(){
    const storedStartTime = this.startTimeRepo.get();
    if(storedStartTime != null) return storedStartTime;
    const time = new Date();
    return time.getHours()*60+time.getMinutes();
  }

  getEndTime(duration){
    return (this.getStartTime() + duration) % 1440;
  }

  getCurrentChargePoint(){
    return this.currentChargePoint;
  }

  selectStartTime(){
    new StartTimeSelection(this.depts).show(this.startTimeRepo.get(), (result)=>{
      this.startTimeRepo.set(result);
      if(this.startTimeChangedCallback) this.startTimeChangedCallback();
      
      this.analytics.log('event', 'time_of_day_changed',{new_value: result});
    })
  }

}