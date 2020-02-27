require('jsrender')($);

import ManageMyTariffs from './manage_my_tariffs';
import MyVehicle from './my_vehicle';
import AppInstall from './app_install';
import StationPrices from './station_prices';

export default class Sidebar {

  constructor(translation,analytics) {
    this.translation=translation;
    this.analytics = analytics;
    this.manageMyTariffs = new ManageMyTariffs(this,analytics);
    this.appInstall = new AppInstall(analytics);
    this.myVehicle = new MyVehicle(this,analytics);
    this.stationPrices = new StationPrices(this,analytics);
    this.loaded = false;
    this.component = $("#sidebar");
    $("#sidebar-close").click(() => this.close());
    $("#adapt-settings").click(() => this.open("settings"));
    $("#show-info").click(() => this.open("info"));
    $("#manage-my-tariffs").click(() => {
      this.open("manageMyTariffs");
      this.manageMyTariffs.initMyTariffs();
    });

    $("#settings-ok").click(() => this.close());
    $("#greenDriveLink").click(()=> this.analytics.log('send', 'event', 'Affiliate', 'greendrive'));
    ["onlyHPC","onlyFree","openNow","onlyShowMyTariffs"].forEach(id=>{
      $(`#${id}`).click(this.optionsChanged.bind(this));
    });

    this.sidebarContent = {
      "settings": {
        header: translation.get("settingsHeader"),
        contentId: "settingsContent"
      },
      "info": {
        header: translation.get("infoHeader"),
        contentId: "infoContent"
      },
      "prices": {
        header: translation.get("pricesHeader"),
        contentId: "pricesContent"
      },
      "manageMyTariffs": {
        header: translation.get("manageMyTariffsHeader"),
        contentId: "manageMyTariffsContent"
      }
    };

    this.currentSidebarContentKey = null;
    
    this.close();
    this.hideAllSidebarContent();
    this.registerConverters();
    this.loadSettings();

    this.loaded = true;
  }

  registerConverters(){
    $.views.converters({
      dec: val => val.toFixed(2),
      perc: val => `${(val*100).toFixed(0)}%`,
      int: val=>val.toFixed(0),
      time: val => {
        const h = Math.floor(val / 60);
        const min = Math.floor(val % 60);
        return this.translation.stringFormatWithKey("timeFormat",h,min);
      },
      upper: val => val.toUpperCase()
    });
    $.views.helpers("c",(converter,param)=>$.views.converters[converter](param));
  }

  chargingOptions(){
    return {
      duration: parseInt(parseFloat($("#select-duration").val())*60),
      kwh: parseFloat($("#select-kwh").val()),
      chargePointId: $("#select-charge-point option:selected").val(),
      onlyHPC: $("#onlyHPC:checked").length == 1,
      onlyFree: $("#onlyFree:checked").length == 1,
      openNow: $("#openNow:checked").length == 1,
      carACPhases: ($("#uniphaseAC:checked").length == 1) ? 1 : 3,
      providerCustomerTarrifs: $("#providerCustomerOnly:checked").length == 1,
      onlyShowMyTariffs: $("#onlyShowMyTariffs:checked").length == 1,
      allowUnbalancedLoad: !this.translation.showUnbalancedLoad() || ($("#allowUnbalancedLoad:checked").length == 1),
      onlyTariffsWithoutMonthlyFees: $("#onlyTariffsWithoutMonthlyFees:checked").length == 1,
      batteryRange: this.stationPrices.getBatteryRange(),
      myTariffs: this.manageMyTariffs.getMyTariffs(),
      myVehicle: this.myVehicle.getVehicle()
    }
  }

  loadSettings(){
    if(typeof(Storage) === "undefined") return;
    if(localStorage.getItem("duration")=== null ) return;

    $("#select-duration").val(localStorage.getItem("duration"))
    $("#select-kwh").val(localStorage.getItem("kwh"))

    const attributeComponentMapping = {
      "onlyHPC": "onlyHPC",
      "onlyFree": "onlyFree",
      "openNow": "openNow",
      "carACPhases": "uniphaseAC",
      "providerCustomerTarrifs": "providerCustomerOnly",
      "onlyShowMyTariffs": "onlyShowMyTariffs",
      "allowUnbalancedLoad": "allowUnbalancedLoad",
      "onlyTariffsWithoutMonthlyFees": "onlyTariffsWithoutMonthlyFees",
    }

    for (var key in attributeComponentMapping) {
      const value = attributeComponentMapping[key];
      if(localStorage.getItem(key) == "true"){
        $(`#${value}`).prop('checked', true);
      }
    }
  }

  storeSettings(){
    if(typeof(Storage) === "undefined" || !this.loaded) return;

    localStorage.setItem("duration", $("#select-duration").val());
    localStorage.setItem("kwh", $("#select-kwh").val());

    const opts = this.chargingOptions();
    const attributeComponentMapping = {
      "onlyHPC": true,
      "onlyFree": true,
      "openNow": true,
      "carACPhases": 1,
      "providerCustomerTarrifs": true,
      "onlyShowMyTariffs": true,
      "allowUnbalancedLoad": true,
      "onlyTariffsWithoutMonthlyFees": true
    }

    for (var key in attributeComponentMapping) {
      const value = attributeComponentMapping[key];
      localStorage.setItem(key, opts[key] == value);
    }
  }

  showStation(station){
    this.stationPrices.showStation(station, this.chargingOptions());

    this.open("prices");    
  }

  updateStationPrice(station,prices,options){
    this.stationPrices.updateStationPrice(station,prices,options)
  }

  onSelectedChargePointChanged(callback){
    $("#select-charge-point").change(()=>{
      callback();
    });
  }

  onOptionsChanged(callback){
    this.optionsChangedCallback = callback;
  }

  optionsChanged(){
    this.optionsChangedCallback();
  }

  open(contentKey) {
    this.analytics.log('send', 'event', 'Sidebar', 'open', contentKey); 

    this.component.show();

    const content = this.sidebarContent[contentKey];
    $("#sidebarHeader").text(content.header)

    if (this.currentSidebarContentKey) {
      const oldContent = this.sidebarContent[this.currentSidebarContentKey];
      $(`#${oldContent.contentId}`).hide();
    }
    $(`#${content.contentId}`).show();
    this.currentSidebarContentKey = contentKey;
  }

  close() {
    this.component.hide();
    this.storeSettings();
  }

  hideAllSidebarContent() {
    for (var key in this.sidebarContent) {
      const content = this.sidebarContent[key];
      $(`#${content.contentId}`).hide();
    }
  }
}