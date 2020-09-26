import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
export default class SettingsSidebar extends ViewBase {
  constructor(depts) {
    super(depts);
    this.settingsPrimitive = depts.settingsPrimitive();
    this.selectedMinPower = 0;
  }

  template(){
    return html`
    <label class="w3-block">${this.t("myVehicle")}</label>
    <div id="selectVehicle" class="w3-margin-bottom"></div>

    <input @click="${()=>this.onOptionsChanged()}" id="onlyTariffsWithoutMonthlyFees" class="w3-check" type="checkbox">
    <label>${this.t("onlyTariffsWithoutMonthlyFees")}</label><br>

    <input @click="${()=>this.onOptionsChanged()}" id="providerCustomerTariffs" class="w3-check w3-margin-top" type="checkbox">
    <label>${this.t("showExclusiveProviderCustomerTariffs")}</label><br>
    <label class="w3-small">${this.t("showExclusiveProviderCustomerTariffsDetail")}</label><br>

    <input @click="${()=>this.onOptionsChanged()}" id="onlyShowMyTariffs" class="w3-check w3-margin-top" type="checkbox">
    <label>${this.t("onlyShowMyTariffs")}</label><br>
    <label class="w3-small">${this.t("onlyShowMyTariffsDetail")}</label><br>
    <label id="manage-my-tariffs" @click="${()=>this.onShowMyTariffs()}" class="w3-small link-text">${this.t("manageMyTariffsLink")}</label><br>

    <label class="w3-margin-top w3-large w3-block">${this.t("mapFilter")}</label>

    <div id="powerSliderInfo" >${this.powerValueTemplate()}</div>
    <div class="w3-row w3-margin-top" id="powerSlider"></div>

    <input @click="${()=>this.onOptionsChanged()}" id="onlyFree" class="w3-check w3-margin-top" type="checkbox">
    <label>${this.t("onlyFreeStations")}</label><br>

    <input @click="${()=>this.onOptionsChanged()}" id="openNow" class="w3-check w3-margin-top" type="checkbox">
    <label>${this.t("onlyOpenNow")}</label><br>

    <label class="w3-block w3-margin-top">${this.t("displayedCurrencyHeader")}</label>
    <div id="selectCurrency"></div>

    ${this.translation.showUnbalancedLoad() ?
      html`
      <label class="w3-margin-top w3-large w3-block">${this.t("expertOptions")}</label>

      <input id="allowUnbalancedLoad" class="w3-check" type="checkbox">
      <label>${this.t("unbalancedLoadHeader")}</label><br>
      <label class="w3-small">${this.t("unbalancedLoadDetail")}</label><br>
      `:""
    }

    <button id="settings-ok" @click="${()=>this.onOk()}" class="w3-btn pc-secondary w3-margin-top">${this.t("ok")}</button>
    `;
  }

  render(){
    render(this.template(),document.getElementById("settingsContent"));
    this.loadModel();
    this.initSlider();
  }

  powerValueTemplate(){
    const powerStringValue = parseInt(this.selectedMinPower)==this.selectedMinPower ? parseInt(this.selectedMinPower) : this.selectedMinPower;
    if(this.selectedMinPower==0) return html`${this.t("minPowerInfoAny")}`;
    return html`${this.sf(this.t("minPowerInfo"),powerStringValue)}`;
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
        'max': 300,
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

    slider.noUiSlider.on('end', ()=>this.onOptionsChanged());
  }

  onShowMyTariffs(){
    this.sidebar.open("manageMyTariffs");
    this.sidebar.manageMyTariffs.initMyTariffs();
  }

  onOk(){
    this.sidebar.close();
    this.saveModel();
  }

  onOptionsChanged(){
    this.saveModel();
    this.sidebar.optionsChanged();
  }

  inject(sidebar){
    this.sidebar = sidebar;
    this.sidebar.settingsView = this;
  }

  getModel(){
    return {
      minPower: this.selectedMinPower,
      onlyFree: this.isChecked("onlyFree"),
      openNow: this.isChecked("openNow"),
      providerCustomerTariffs: this.isChecked("providerCustomerTariffs"),
      onlyShowMyTariffs: this.isChecked("onlyShowMyTariffs"),
      onlyTariffsWithoutMonthlyFees: this.isChecked("onlyTariffsWithoutMonthlyFees")
    }
  }

  loadModel(){
    this.selectedMinPower = this.settingsPrimitive.getFloat("minPower",11);
    ["onlyFree","openNow","providerCustomerTariffs","onlyShowMyTariffs","onlyTariffsWithoutMonthlyFees"].forEach(
      key => this.setChecked(key,this.settingsPrimitive.getBoolean(key))
    );
  }

  saveModel(){
    const model = this.getModel();
    this.settingsPrimitive.setFloat("minPower", this.selectedMinPower);
    ["onlyFree","openNow","providerCustomerTariffs","onlyShowMyTariffs","onlyTariffsWithoutMonthlyFees"].forEach(
      key => this.settingsPrimitive.setBoolean(key, model[key])
    );
  }
}

