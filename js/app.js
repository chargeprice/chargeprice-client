class App {

  constructor() {
    this.goingElectric = new GoingElectric();
    this.stationTariffs = new StationTariffs();
    this.map = new Map();
    this.sidebar = new Sidebar();

    this.currentStationTariffs = null;

    if (!navigator.geolocation) {
      this.showFallbackLocation();
    }

    this.map.onBoundsChanged(this.showStationsAtLocation.bind(this));
    this.sidebar.onSelectedConnectorChanged(this.selectedConnectorChanged.bind(this));
    this.getCurrentLocation();

    $("#onlyHPC").click(()=>this.showStationsAtLocation(this.map.getBounds()));

    this.sidebar.open("settings");

    this.stationTariffs.check();
  }

  getCurrentLocation() {
    navigator.geolocation.getCurrentPosition((pos) => {
      this.map.centerLocation(pos.coords)
    }, () => {
      alert("Standort konnte nicht ermittelt werden!");
      this.showFallbackLocation();
    });
  }

  showFallbackLocation() {
    this.map.centerLocation({
      longitude: 13,
      latitude: 46
    });
  }

  chargingOptions(){
    return {
      duration: parseInt($("#select-duration option:selected").val()),
      kwh: parseInt($("#select-kwh option:selected").val()),
      connectorId: $("#select-connector option:selected").val(),
      onlyHPC: $("#onlyHPC:checked").length == 1,
      carACPhases: $("#uniphaseAC:checked").length == 1 ? 1 : 3
    }
  }

  toggleLoading(value){
    $("#loadingIndicator").toggle(value);
  }

  async showStationsAtLocation(bounds) {

    const isBigArea = this.map.isBigArea();


    $("#pleaseZoom").toggle(isBigArea);
    if(isBigArea){
      this.map.clearMarkers();
      return;
    }

    const options = this.chargingOptions();
    this.toggleLoading(true);
    const stations = await this.goingElectric.getStations(bounds.northEast, bounds.southWest,options.onlyHPC);
    this.map.clearMarkers();
    stations.forEach(st => this.map.addStation(st, this.stationSelected.bind(this)))
    this.toggleLoading(false);
  }

  async stationSelected(model) {
    ga('send', 'event', 'Station', 'show');
    this.toggleLoading(true);
    this.currentStationTariffs = await this.stationTariffs.getTariffsOfStation(model.id);
    this.sidebar.showStation(this.currentStationTariffs.station,this.chargingOptions());
    this.selectedConnectorChanged();
    this.toggleLoading(false);
  }

  selectedConnectorChanged(){
    const options = this.chargingOptions();
    if(options.connectorId == null) return;

    const st = this.currentStationTariffs;

    const prices = st.availableTariffs.map(tariff=>{
      const price = new CalculatePrice(st.station,tariff,options).run();
      if(price!=null) return { tariff: tariff, price: price };
    }).filter(p=>p);

    this.sidebar.updateStationPrice(this.currentStationTariffs.station,prices,options);
  }
}

$(document).ready(()=>new App());