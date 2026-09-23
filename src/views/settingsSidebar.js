import { html, render } from 'lit';
import ViewBase from '../component/viewBase';
import CompanySearchBox from '../component/companySearchBox';
import FACILITIES from '../helper/facilities';
import 'nouislider/dist/nouislider.css';

export default class SettingsSidebar extends ViewBase {
  constructor(depts, userSettings) {
    super(depts);
    this.depts = depts;
    this.analytics = depts.analytics();
    this.settingsPrimitive = depts.settingsPrimitive();
    this.themeLoader = depts.themeLoader();
    this.selectedMinPower = 0;
    this.userSettings = userSettings;
    this.filteredCpos = [];
    this.selectedFacilities = [];
    this.defaultBatteryRange = [20,80];
    this.batterySlider = null;
  }

  template(){
    return html`
    <label class="w3-margin-bottom w3-large w3-block">${this.t("myVehicle")}</label>

    <div id="vehicleInfo" class="w3-margin-bottom"></div>
    <div id="batteryRange" class="w3-margin-top"></div>
    <div id="batteryRangeLabel" class="w3-small w3-margin-top"></div>

    <label class="w3-margin-bottom w3-block" style="margin-top: 24px;">${this.t("mapFilter")}</label>

    <div id="cpoFilter" class="w3-margin-bottom"></div>

    <div id="powerSliderInfo" ></div>
    <div class="w3-small">${this.t("zoomLevelDependentStation")}</div>
    <div class="w3-row w3-margin-top" id="powerSlider"></div>

    <label class="w3-margin-bottom w3-block" style="margin-top: 24px;">${this.t("facilitiesHeader")}</label>
    <div id="facilitiesFilter" class="w3-margin-bottom"></div>
    `;
  }

  vehicleInfoTempl(){
    const vehicle = this.sidebar.myVehicle.getVehicle();
    if(!vehicle) return "";

    return html`
      <a href="#" class="tariff-link" @click="${(e)=>{e.preventDefault(); this.sidebar.myVehicle.changeVehicle();}}"><i class="fa fa-car"></i> ${vehicle.brand} ${vehicle.name} <i class="fa fa-pencil"></i></a>
    `;
  }

  batteryRangeLabelTempl(range){
    return html`${this.sf(this.t("batteryRangeShort"),range[0],range[1])}`;
  }

  cpoFilterTemplate(){
    return html`
      <div>
      <company-search-box placeholder="${this.t("filterOperators")}" @company-changed="${(res)=>this.onCompanyChanged(res.detail)}"></company-search-box>
      <div class="w3-margin-top">
        ${this.filteredCpos.map(cpo=>html`
          <span class="w3-tag w3-round w3-light-grey">
            ${cpo.name}
            <i class="fas fa-times w3-margin-left" @click="${()=>this.onRemoveCpo(cpo)}"></i>
          </span>
        `)}
      </div>
      </div>
    `;
  }

  facilitiesTemplate(){
    return html`
      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        ${FACILITIES.map(facility=>html`
          <span @click="${()=>this.onToggleFacility(facility.id)}"
            class="w3-tag w3-round cp-clickable ${this.selectedFacilities.includes(facility.id) ? "pc-secondary" : "w3-white w3-border"}"
            style="padding: 8px 10px;">
            <i class="fa fa-${facility.icon}"></i> ${this.t('facility_'+facility.id)}
          </span>
        `)}
      </div>
    `;
  }

  render(){
    render(this.template(),this.getEl("settingsContent"));
    this.loadModel();
    this.initPowerSlider();
    this.initBatteryRangeSlider();
    this.rerenderCpoFilter();
    this.rerenderFacilities();
  }

  powerValueTemplate(){
    const powerStringValue = parseInt(this.selectedMinPower)==this.selectedMinPower ? parseInt(this.selectedMinPower) : this.selectedMinPower;
    if(this.selectedMinPower==0) return html`${this.t("minPowerInfoAny")}`;
    return html`${this.sf(this.t("minPowerInfo"),powerStringValue)}`;
  }

  initPowerSlider(){
    const slider = document.getElementById('powerSlider');
    noUiSlider.create(slider, {
      start: [this.selectedMinPower],
      connect: 'upper',
      snap: true,
      range: { min: 0,max: 350 },
      range: {
        'min': 0,
        '11%': 3.7,
        '22%': 11,
        '33%': 22,
        '44%': 43,
        '55%': 50,
        '66%': 75,
        '77%': 100,
        '88%': 150,
        'max': 250,
      },
      pips: {
        mode: 'positions',
        values: [0, 22, 33, 55, 77, 100],
        density: 11,
        stepped: true
      }
    });

    slider.noUiSlider.on('update', (values)=>{
      this.selectedMinPower = values[0];
      render(this.powerValueTemplate(),document.getElementById("powerSliderInfo"));
    });

    slider.noUiSlider.on('end', ()=>this.onOptionsChanged("connector_speed"));
  }

  initBatteryRangeSlider(){
    this.batterySlider = document.getElementById('batteryRange');

    noUiSlider.create(this.batterySlider, {
      start: this.getStoredOrDefaultBatteryRange(),
      step: 1,
      margin: 1,
      connect: true,
      range: { min: 0,max: 100 }
    });

    this.renderBatteryRangeLabel();
    this.batterySlider.noUiSlider.on('update', ()=>this.renderBatteryRangeLabel());
    this.batterySlider.noUiSlider.on('end', ()=>{
      this.storeBatteryRange();
      const range = this.getBatteryRange();

      this.analytics.log('event', 'battery_changed',{
        percentage_start: range[0],
        percentage_end: range[1]
      });

      if(this.batteryChangedCallback) this.batteryChangedCallback();
    });
  }

  getBatteryRange(){
    return this.batterySlider.noUiSlider.get().map(v=>parseInt(v));
  }

  getStoredOrDefaultBatteryRange(){
    if(localStorage.getItem("batteryRange")){
      return JSON.parse(localStorage.getItem("batteryRange"));
    }
    else return this.defaultBatteryRange;
  }

  storeBatteryRange(){
    localStorage.setItem("batteryRange",JSON.stringify(this.getBatteryRange()));
  }

  onBatteryRangeChanged(callback){
    this.batteryChangedCallback = callback;
  }

  renderVehicleInfo(){
    render(this.vehicleInfoTempl(),this.getEl("vehicleInfo"));
  }

  renderBatteryRangeLabel(){
    render(this.batteryRangeLabelTempl(this.getBatteryRange()),this.getEl("batteryRangeLabel"));
  }

  onOptionsChanged(trackingKey){
    this.saveModel();

    if(trackingKey) this.trackChange(trackingKey);

    this.sidebar.optionsChanged();
  }

  inject(sidebar){
    this.sidebar = sidebar;
    this.sidebar.settingsView = this;

    this.sidebar.myVehicle.onChanged(()=>this.renderVehicleInfo());
    this.renderVehicleInfo();
  }

  onCompanyChanged(company){
    const alreadyInList = this.filteredCpos.some(c=>c.id == company.id);
    if(alreadyInList) return;
    this.filteredCpos.push(company);

    this.rerenderCpoFilter();
    this.sidebar.optionsChanged();
  }

  onRemoveCpo(cpo){
    this.filteredCpos = this.filteredCpos.filter(c=>c.id != cpo.id);

    this.rerenderCpoFilter();
    this.sidebar.optionsChanged();
  }

  rerenderCpoFilter(){
    render(this.cpoFilterTemplate(),this.getEl("cpoFilter"));
  }

  onToggleFacility(facilityId){
    if(this.selectedFacilities.includes(facilityId)){
      this.selectedFacilities = this.selectedFacilities.filter(f=>f!=facilityId);
    }
    else {
      this.selectedFacilities = this.selectedFacilities.concat([facilityId]);
    }

    this.rerenderFacilities();
    this.sidebar.optionsChanged();
  }

  rerenderFacilities(){
    render(this.facilitiesTemplate(),this.getEl("facilitiesFilter"));
  }

  getModel(){
    return {
      minPower: this.selectedMinPower,
      cpoFilterChargeprice: this.filteredCpos.map(c=>c.id),
      facilities: this.selectedFacilities,
      isPro: this.userSettings.isPro,
      isMobilePremium: this.userSettings.isMobilePremium,
    }
  }

  loadModel(){
    this.selectedMinPower = this.settingsPrimitive.getFloat("minPower",3.7);
  }

  saveModel(){
    this.settingsPrimitive.setFloat("minPower", this.selectedMinPower);
  }

  trackChange(trackingKey){
    const model = this.getModel();
    switch(trackingKey){
      case "connector_speed":
        this.analytics.log('event', trackingKey,{new_value: parseInt(model.minPower)});
        break;
    }
  }
}

