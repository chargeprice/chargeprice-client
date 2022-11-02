import { html, render } from 'lit';
import ViewBase from '../component/viewBase';
import GenericList from '../modal/genericList';
import Authorization from '../component/authorization';

export default class SettingsSidebar extends ViewBase {
  constructor(depts) {
    super(depts);
    this.depts = depts;
    this.analytics = depts.analytics();
    this.settingsPrimitive = depts.settingsPrimitive();
    this.customConfig = depts.customConfig();
    this.currency = depts.currency();
    this.selectedMinPower = 0;

    this.checkBoxes = [
      "onlyFree",
      "openNow",
      "providerCustomerTariffs",
      "onlyShowMyTariffs",
      "onlyTariffsWithoutMonthlyFees",
      "allowUnbalancedLoad",
      "showPriceDetails"
    ]
  }

  template(){
    return html`
    <label class="w3-block">${this.t("myVehicle")}</label>
    <div id="selectVehicle" class="w3-margin-bottom"></div>

    <input @click="${()=>this.onOptionsChanged("tariff_without_subscription")}" id="onlyTariffsWithoutMonthlyFees" class="w3-check" type="checkbox">
    <label>${this.t("onlyTariffsWithoutMonthlyFees")}</label><br>

    <input @click="${()=>this.onOptionsChanged("customer_tariff")}" id="providerCustomerTariffs" class="w3-check w3-margin-top" type="checkbox">
    <label>${this.t("showExclusiveProviderCustomerTariffs")}</label><br>
    <label class="w3-small">${this.t("showExclusiveProviderCustomerTariffsDetail")}</label><br>

    <input @click="${()=>this.onOptionsChanged()}" id="onlyShowMyTariffs" class="w3-check w3-margin-top" type="checkbox">
    <label>${this.t("onlyShowMyTariffs")}</label><br>
    <label class="w3-small">${this.t("onlyShowMyTariffsDetail")}</label><br>
    <label @click="${()=>this.onShowMyTariffs()}" class="link-text">${this.t("manageMyTariffsLink")}</label><br>

    <label class="w3-margin-top w3-margin-bottom w3-large w3-block">${this.t("mapFilter")}</label>

    ${this.customConfig.isInternalMode() ? html`
      <label>Filter CPO (Chargeprice ID)</label><br>
      <input id="cpoFilterChargeprice" @change="${()=>this.onOptionsChanged()}" class="w3-input w3-border w3-margin-bottom"></input>
      ` : ""}

    <div id="powerSliderInfo" ></div>
    <div class="w3-small">${this.t("zoomLevelDependentStation")}</div>
    <div class="w3-row w3-margin-top" id="powerSlider"></div>

    <input @click="${()=>this.onOptionsChanged("free_charging_changed")}" id="onlyFree" class="w3-check w3-margin-top" type="checkbox">
    <label>${this.t("onlyFreeStations")}</label><br>

    <input @click="${()=>this.onOptionsChanged()}" id="openNow" class="w3-check w3-margin-top" type="checkbox">
    <label>${this.t("onlyOpenNow")}</label><br>

    <label class="w3-block w3-margin-top">${this.t("displayedCurrencyHeader")}</label>
    <div id="selectCurrency">${this.currencyTemplate()}</div>

    <label class="w3-margin-top w3-large w3-block">${this.t("expertOptions")}</label>

    <input @click="${()=>this.onOptionsChanged()}" id="showPriceDetails" class="w3-check" type="checkbox">
    <label>${this.t("priceDetailsLabel")}</label><br>
    <label class="w3-small">${this.t("priceDetailsDetails")}</label><br>

    ${this.translation.showUnbalancedLoad() ?
      html`
      <input id="allowUnbalancedLoad"  @click="${()=>this.onOptionsChanged()}" class="w3-check" type="checkbox">
      <label>${this.t("unbalancedLoadHeader")}</label><br>
      <label class="w3-small">${this.t("unbalancedLoadDetail")}</label><br>
      `:""
    }

    <button id="settings-ok" @click="${()=>this.onOk()}" class="w3-btn pc-secondary w3-margin-top">${this.t("ok")}</button>
    `;
  }

  currencyTemplate(){
    return html`
      <span @click="${()=>this.onChangeCurrency()}" class="w3-button w3-light-gray">
        ${this.currency.getDisplayedCurrency()}
      </span>
    `;
  }

  render(){
    render(this.template(),this.getEl("settingsContent"));
    this.loadModel();
    this.initSlider();
  }

  powerValueTemplate(){
    const powerStringValue = parseInt(this.selectedMinPower)==this.selectedMinPower ? parseInt(this.selectedMinPower) : this.selectedMinPower;
    if(this.selectedMinPower==0) return html`${this.t("minPowerInfoAny")}`;
    return html`${this.sf(this.t("minPowerInfo"),powerStringValue)}`;
  }

  onChangeCurrency(){
    new GenericList(this.depts).show(
      {
        items: this.currency.getAvailableCurrencies(),
        header: this.translation.get("displayedCurrencyHeader"), 
        convert: i => i,
        narrow: true
      },(c)=>this.currencyChanged(c));
  }

  currencyChanged(value){
    this.currency.changeCurrency(value);
    this.sidebar.optionsChanged();
    this.analytics.log('event', 'currency_changed',{new_value: value});
    render(this.currencyTemplate(),this.getEl("selectCurrency"));
  }

  initSlider(){
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

  onShowMyTariffs(){
    this.sidebar.showMyTariffs();
  }

  onOk(){
    this.sidebar.close();
    this.saveModel();
  }

  onOptionsChanged(trackingKey){
    this.saveModel();

    if(trackingKey) this.trackChange(trackingKey);

    this.sidebar.optionsChanged();
  }

  inject(sidebar){
    this.sidebar = sidebar;
    this.sidebar.settingsView = this;
  }

  cpoFilterChargeprice(){
    const cpoFilterElement = this.getEl("cpoFilterChargeprice");
    if(!cpoFilterElement || cpoFilterElement.length==0) return null;

    return cpoFilterElement.value;
  }

  getModel(){
    return {
      minPower: this.selectedMinPower,
      onlyFree: this.isChecked("onlyFree"),
      openNow: this.isChecked("openNow"),
      providerCustomerTariffs: this.isChecked("providerCustomerTariffs"),
      onlyShowMyTariffs: this.isChecked("onlyShowMyTariffs"),
      onlyTariffsWithoutMonthlyFees: this.isChecked("onlyTariffsWithoutMonthlyFees"),
      allowUnbalancedLoad: this.isChecked("allowUnbalancedLoad"),
      cpoFilterChargeprice: this.cpoFilterChargeprice(),
      showPriceDetails: this.isChecked("showPriceDetails")
    }
  }

  loadModel(){
    this.selectedMinPower = this.settingsPrimitive.getFloat("minPower",3.7);
    this.checkBoxes.forEach(
      key => this.setChecked(key,this.settingsPrimitive.getBoolean(key))
    );
  }

  saveModel(){
    const model = this.getModel();
    this.settingsPrimitive.setFloat("minPower", this.selectedMinPower);
    this.checkBoxes.forEach(
      key => this.settingsPrimitive.setBoolean(key, model[key])
    );
  }

  trackChange(trackingKey){
    const model = this.getModel();
    switch(trackingKey){
      case "tariff_without_subscription":
        this.analytics.log('event', trackingKey,{new_value: model.onlyTariffsWithoutMonthlyFees});
        break;
      case "customer_tariff":
        this.analytics.log('event', trackingKey,{new_value: model.providerCustomerTariffs});
        break;
      case "free_charging_changed":
        this.analytics.log('event', trackingKey,{new_value: model.onlyFree});
        break;
      case "connector_speed":
        this.analytics.log('event', trackingKey,{new_value: parseInt(model.minPower)});
        break;
    }
  }
}

