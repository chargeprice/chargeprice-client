class App {

  constructor() {
    this.deptsLoaded = 0;
    this.deptCount = 2;
    this.fallBackLocation = {
      longitude: 11.6174228,
      latitude: 47.5399148
    };
  }

  initialize(){
    this.deptsLoaded++;
    if(this.deptsLoaded < this.deptCount) return;
    
    this.goingElectric = new GoingElectric();
    this.stationTariffs = new StationTariffs();
    this.map = new Map();
    this.sidebar = new Sidebar();
    this.locationSearch = new LocationSearch();

    this.currentStationTariffs = null;
    this.currentStation = null;

    if (!navigator.geolocation) {
      this.showFallbackLocation();
    }

    this.map.onBoundsChanged(this.showStationsAtLocation.bind(this));
    this.sidebar.onSelectedChargePointChanged(this.selectedChargePointChanged.bind(this));
    this.locationSearch.onResultSelected(coords=>this.map.centerLocation(coords));
    this.getCurrentLocation();

    $("#onlyHPC").click(()=>this.showStationsAtLocation(this.map.getBounds()));
    $("#onlyFree").click(()=>this.showStationsAtLocation(this.map.getBounds()));
    $("#openNow").click(()=>this.showStationsAtLocation(this.map.getBounds()));
    
    this.sidebar.open("settings");

    this.stationTariffs.check();
  }

  getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      pos => this.map.centerLocation(pos.coords), 
      () => this.showFallbackLocation());
  }

  showFallbackLocation() {
    this.map.centerLocation(fallBackLocation,8);
  }

  toggleLoading(value){
    $("#loadingIndicator").toggle(value);
  }

  async showStationsAtLocation(bounds) {
    const options = this.sidebar.chargingOptions();

    const isBigArea = this.map.isBigArea(options.onlyHPC);

    $("#pleaseZoom").toggle(isBigArea);
    if(isBigArea){
      this.map.clearMarkers();
      return;
    }

    this.toggleLoading(true);
    try {
      const stations = await this.goingElectric.getStations(bounds.northEast, bounds.southWest,options);
      this.map.clearMarkers();
      stations.forEach(st => this.map.addStation(st, this.stationSelected.bind(this)));
    }
    catch(ex){
      this.showAlert("Stationen konnten nicht geladen werden.")
    }
    this.toggleLoading(false);
  }

  async stationSelected(model) {
    this.log('send', 'event', 'Station', 'show');
    this.toggleLoading(true);
    try{
      this.currentStation = await this.goingElectric.getStationDetails(model.id)
      const options = this.sidebar.chargingOptions();
      this.currentStationTariffs = await this.stationTariffs.getTariffsOfStation(this.currentStation,options);
      this.sidebar.showStation(this.currentStation,options);
      this.selectedChargePointChanged();
    }
    catch(ex){
      this.showAlert("Preise konnten nicht geladen werden.")
    }
    
    this.toggleLoading(false);
  }

  selectedChargePointChanged(){
    const options = this.sidebar.chargingOptions();
    const selectedCP = this.currentStation.chargePoints.find(c=>c.id == options.chargePointId);
    if(selectedCP == null) return;

    const prices = this.currentStationTariffs.reduce((memo,tariff)=>{
      const chargePointPrice = tariff.chargePointPrices.find(cpp=>
        cpp.power == selectedCP.power && cpp.plug == selectedCP.plug);

      if(chargePointPrice) memo.push({ price: chargePointPrice.price, tariff: tariff });
      return memo;
    },[]);

    this.sidebar.updateStationPrice(this.currentStation,prices,options);
  }

  showAlert(message) {
    $("#snackbar").text(message);
    $("#snackbar").show();
    
    setTimeout(()=>$("#snackbar").hide(), 5000);
  }

  log(){
    if(typeof(ga) == "undefined") return;
    ga.apply(null,arguments);
  }
}