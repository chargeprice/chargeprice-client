import ViewBase from './viewBase';
import StartTimeSelection from '../modal/startTimeSelection';
import {html, render} from 'lit-html';
import RepositoryStartTime from '../repository/settings/startTime';
import PriceListView from '../views/priceList';
import StationDetailsView from '../views/stationDetails';

export default class StationPrices extends ViewBase{
  constructor(sidebar,depts) {
    super(depts);
    this.sidebar = sidebar;
    this.analytics = depts.analytics();
    this.startTimeRepo = new RepositoryStartTime();
    this.currentChargePoint = null;
    this.chargePointsSortedByPower = []
    this.settingsPrimitive = depts.settingsPrimitive();
    this.chargingStationRepo = depts.chargingStation();
  }

  parameterNoteTempl(obj){
    return html`
      <div class="charge-summary">
        <span class="charge-summary-item">
          <i class="fa fa-clock-o"></i>
          <span class="link-text" @click="${()=>this.selectStartTime()}">${this.h().timeOfDay(this.getStartTime())}</span>
          &rarr;
          ${this.h().timeOfDay(this.getEndTime(obj.chargePointDuration))}
          <span class="w3-text-gray">(${this.h().time(obj.chargePointDuration)})</span>
        </span>
        <span class="charge-summary-item">
          <i class="fa fa-bolt"></i>
          ${this.h().int(obj.chargePointEnergy)} kWh
          <span class="w3-text-gray">(ø ${this.h().power(obj.chargePointEnergy*60/obj.chargePointDuration)} kW)</span>
        </span>
        ${obj.tripBatteryRange ? html`
          <span class="charge-summary-item charge-summary-trip">
            <i class="fa fa-route"></i>
            ${this.sf(this.t("routeChargeStopBatteryRange"), obj.tripBatteryRange[0], obj.tripBatteryRange[1])}
          </span>
        ` : ""}
      </div>
    `;
  }

  currentChargePointTemplate(){
    const obj = this.currentChargePoint;
    if(!obj)return "";
    return this.chargePointsSortedByPower.map(cp=> html`
      <span @click="${()=>this.onChargePointChanged(cp)}" class="cp-button ${cp == obj ? "pc-main" : "w3-light-gray"} w3-margin-top w3-margin-bottom ${cp.supportedByVehicle ? "": "w3-disabled"}">
        <label>${cp.power} kW</label> <label class="w3-small">${this.h().upper(cp.plug)}</label><br>
        <label class="w3-small">${this.availabilityCountTemplate(cp) }</label>
        
      </span>
    `);
  }

  availabilityCountTemplate(chargePoint){
    if(chargePoint.availableCount == null) return `${chargePoint.count}x`;

    const countText = `${chargePoint.availableCount}\/${chargePoint.count}`;
    const color = chargePoint.availableCount == 0 ? "w3-red" : "w3-green";
    
    return html`<span class="w3-tag ${color}">${countText} ${this.t("liveStatusAvailable")}</span>`;
  }

  // Only premium users can report missing prices
  feedbackTemplate(context){
    if(this.sidebar.premiumGate.isRestricted()) return "";

    return html`
      <button @click="${()=>this.onReportMissingPrice(context)}" class="w3-btn pc-secondary">
        ${this.t("fbReportMissingPriceHeader")}
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

  showStation(station, options, loadAvailability=true){
    this.chargePointsSortedByPower = this.sortChargePointsByPower(station.chargePoints);
    this.currentChargePoint = this.chargePointsSortedByPower[0];
    this.renderCurrentChargePointTemplate();
    this.selectedChargePointChangedCallback();
    this.renderStationDetails(station);

    if(loadAvailability) this.loadStationWithAvailability(station, options);
  }

  loadStationWithAvailability(station,options){
    this.chargingStationRepo.getStationDetails(station.id,{ availability: (options.isPro || options.isMobilePremium), myVehicle: options.myVehicle }).then(data=>{
      this.showStation(data, options, false);
    });
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
    render(this.parameterNoteTempl(options),this.getEl("parameterNote"));

    const sortedPrices = prices.sort((a,b)=>this.sortPrice(a.price, b.price));
    new PriceListView(this.depts,this.sidebar).render(sortedPrices, options, station, "prices")
    render(this.stationPriceGeneralInfoTemplate(station, prices),this.getEl("priceInfo"))
    render(this.feedbackTemplate({options: options, station: station, prices: sortedPrices}),this.getEl("priceFeedback")); 
  }

  renderStationDetails(station){
    this.currentStation = station;
    const tripAction = this.sidebar.routePlanner ? this.sidebar.routePlanner.chargeStopActionTemplate(station) : "";
    new StationDetailsView(this.depts).render(station,"station-info", tripAction);
  }

  // e.g. after the station became a charging stop of the route
  refreshStationDetails(){
    if(this.currentStation) this.renderStationDetails(this.currentStation);
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

  onStartTimeChanged(callback){
    this.startTimeChangedCallback = callback;
  }

  onSelectedChargePointChanged(callback){
    this.selectedChargePointChangedCallback=callback;
  }

  onReportMissingPrice(context){
    this.sidebar.feedback.missingPrice(context.station, this.currentChargePoint);
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