class Sidebar {

  constructor() {
    this.loaded = false;
    this.component = $("#sidebar");
    $("#sidebar-close").click(() => this.close());

    $("#adapt-settings").click(() => {
      this.open("settings")
    });
    $("#show-info").click(() => {
      this.open("info")
    });

    $("#settings-ok").click(() => this.close());

    this.sidebarContent = {
      "settings": {
        header: "Eingaben",
        contentId: "settingsContent"
      },
      "info": {
        header: "Info",
        contentId: "infoContent"
      },
      "prices": {
        header: "Preise",
        contentId: "pricesContent"
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
      int: val=>val.toFixed(0),
      time: val => {
        const h = Math.floor(val / 60);
        const min = Math.floor(val % 60);
        return `${h}h ${min}min`
      }
   });
  }

  chargingOptions(){
    return {
      duration: parseFloat($("#select-duration").val())*60,
      kwh: parseFloat($("#select-kwh").val()),
      chargePointId: $("#select-charge-point option:selected").val(),
      onlyHPC: $("#onlyHPC:checked").length == 1,
      onlyFree: $("#onlyFree:checked").length == 1,
      openNow: $("#openNow:checked").length == 1,
      carACPhases: ($("#uniphaseAC:checked").length == 1) ? 1 : 3,
      providerCustomerTarrifs: $("#providerCustomerOnly:checked").length == 1
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
      "providerCustomerTarrifs": "providerCustomerOnly"
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
      "providerCustomerTarrifs": true
    }

    for (var key in attributeComponentMapping) {
      const value = attributeComponentMapping[key];
      localStorage.setItem(key, opts[key] == value);
    }
  }

  showStation(station,options){
    const sortedCP = station.chargePoints.sort((a,b)=>b.power-a.power);
    $("#select-charge-point").html($.templates("#chargePointTempl").render(sortedCP));   

    const parameterNoteHtml = $.templates("#parameterNoteTempl").render(options); 
    $("#parameterNote").html(parameterNoteHtml);

    this.open("prices");    
  }

  updateStationPrice(station,prices,options){
    const sortedPrices = prices.sort((a,b)=>a.price - b.price);

    $("#priceList").html($.templates("#priceTempl").render(sortedPrices));
    $("#station-info").html($.templates("#stationTempl").render(station));
    $("#prices").toggle(!station.isFreeCharging && prices.length > 0 || prices.length > 0);
    $("#noPricesAvailable").toggle(!station.isFreeCharging && prices.length == 0);
  }

  onSelectedChargePointChanged(callback){
    $("#select-charge-point").change(()=>{
      callback();
    });
  }

  open(contentKey) {
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