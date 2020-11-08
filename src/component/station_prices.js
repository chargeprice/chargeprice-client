import ProviderFeaturing from './providerFeaturing';
import ViewBase from './viewBase';
import StartTimeSelection from '../modal/startTimeSelection';
import {html, render} from 'lit-html';
import RepositoryStartTime from '../repository/settings/startTime';
import GenericList from '../modal/genericList';
import ModalFeedback from '../modal/feedback';
import PriceListView from '../views/priceList';
import StationDetailsView from '../views/stationDetails';

export default class StationPrices extends ViewBase{
  constructor(sidebar,depts) {
    super(depts);
    this.sidebar = sidebar;
    this.analytics = depts.analytics();
    this.slider = null;
    this.defaultBatteryRange = [20,80];
    this.startTimeRepo = new RepositoryStartTime();
    this.currentChargePoint = null;
    this.sortedCP = []
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
        (${this.t("average")} ${this.h().power(obj.chargePointEnergy*60/obj.chargePointDuration)} kW)*
      </span>
    `;
  }

  currentChargePointTemplate(){
    const obj = this.currentChargePoint;
    if(!obj)return "";
    return this.sortedCP.map(cp=> html`
      <span @click="${()=>this.onChargePointChanged(cp)}" class="w3-button ${cp == obj ? "pc-main" : "w3-light-gray"} w3-margin-top w3-margin-bottom ${cp.supportedByVehicle ? "": "w3-disabled"}">
        <label>${cp.power} kw</label><br>
        <label class="w3-small">${this.h().upper(cp.plug)}, ${cp.count}x</label>
      </span>
    `);
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

  initSlider(){
    this.slider = document.getElementById('batteryRange');

    noUiSlider.create(this.slider, {
        start: this.getStoredOrDefaultBatteryRange(),
        step: 1,
        connect: true,
        range: { min: 0,max: 100 }
    });

    this.updateBatteryRangeInfo();
    this.slider.noUiSlider.on('update', ()=>this.updateBatteryRangeInfo());
    this.slider.noUiSlider.on('end', ()=>{
      this.storeBatteryRange();
      const range = this.getBatteryRange();
      const totalPercentage = range[1]-range[0]; 
      this.analytics.log('send', 'event', 'BatteryChanged', totalPercentage,null,range[0]);
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

  showStation(station,options){
    this.sortedCP = station.chargePoints.sort((a,b)=>{
      const b1 = b.supportedByVehicle;
      const a1 = a.supportedByVehicle;

      if(b1 == a1) return (b.power-a.power);
      else return b1 - a1;
    });
    this.currentChargePoint = this.sortedCP[0];
    this.renderCurrentChargePointTemplate();
    this.selectedChargePointChangedCallback();
  }

  renderCurrentChargePointTemplate(){
    render(this.currentChargePointTemplate(),document.getElementById("select-charge-point"));
  }

  onChargePointChanged(value){
    this.currentChargePoint = value;
    this.renderCurrentChargePointTemplate();
    if(this.selectedChargePointChangedCallback) this.selectedChargePointChangedCallback(value);
  }
 
  updateStationPrice(station,prices,options){
    const sortedPrices = prices.sort((a,b)=>a.price - b.price);
    this.addFeaturings(sortedPrices);

    new PriceListView(this.depts).render(sortedPrices,options.myTariffs,"priceList")
    new StationDetailsView(this.depts).render(station,"station-info")
    $("#prices").toggle(!station.isFreeCharging && prices.length > 0 || prices.length > 0);
    render(this.stationPriceGeneralInfoTemplate(station, prices),this.getEl("priceInfo"))
    render(this.parameterNoteTempl(options),this.getEl("parameterNote"));
    render(this.feedbackTemplate({options: options, station: station, prices: sortedPrices}),this.getEl("priceFeedback")); 
  }

  addFeaturings(prices){
    const featurings = new ProviderFeaturing().getFeaturedProviders();
    prices.forEach(p=>p.featuring = featurings[p.tariff.provider]);
  }

  onBatteryRangeChanged(callback){
    this.batteryChangedCallback = callback;
  }

  storeBatteryRange(){
    localStorage.setItem("batteryRange",JSON.stringify(this.getBatteryRange()));
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
      const hourTime = result == null ? "now" : (result/60).toFixed(0);
      this.analytics.log('send', 'event', 'StartTimeChanged', hourTime);
    })
  }

}