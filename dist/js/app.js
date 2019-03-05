class App {

  constructor() {
    this.deptsLoaded = 0;
    this.deptCount = 2;
  }

  initialize() {
    this.deptsLoaded++;
    if (this.deptsLoaded < this.deptCount) return;

    this.goingElectric = new GoingElectric();
    this.stationTariffs = new StationTariffs();
    this.map = new Map();
    this.sidebar = new Sidebar();
    this.locationSearch = new LocationSearch();

    this.currentStationTariffs = null;

    if (!navigator.geolocation) {
      this.showFallbackLocation();
    }

    this.map.onBoundsChanged(this.showStationsAtLocation.bind(this));
    this.sidebar.onSelectedConnectorChanged(this.selectedConnectorChanged.bind(this));
    this.locationSearch.onResultSelected(coords => this.map.centerLocation(coords));
    this.getCurrentLocation();

    $("#onlyHPC").click(() => this.showStationsAtLocation(this.map.getBounds()));
    $("#onlyFree").click(() => this.showStationsAtLocation(this.map.getBounds()));
    $("#openNow").click(() => this.showStationsAtLocation(this.map.getBounds()));
    $("#settings-ok").click(() => this.sidebar.close());

    this.sidebar.open("settings");

    this.stationTariffs.check();
  }

  getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
      this.map.centerLocation(pos.coords);
    }, () => {
      this.showFallbackLocation();
    });
  }

  showFallbackLocation() {
    this.map.centerLocation({
      longitude: 11.6174228,
      latitude: 47.5399148
    }, 8);
  }

  chargingOptions() {
    return {
      duration: parseFloat($("#select-duration").val()) * 60,
      kwh: parseFloat($("#select-kwh").val()),
      connectorId: $("#select-connector option:selected").val(),
      onlyHPC: $("#onlyHPC:checked").length == 1,
      onlyFree: $("#onlyFree:checked").length == 1,
      openNow: $("#openNow:checked").length == 1,
      carACPhases: $("#uniphaseAC:checked").length == 1 ? 1 : 3,
      customerOf: $("#providerCustomerOnly:checked").length == 1 ? "ALL" : null
    };
  }

  toggleLoading(value) {
    $("#loadingIndicator").toggle(value);
  }

  async showStationsAtLocation(bounds) {
    const options = this.chargingOptions();

    const isBigArea = this.map.isBigArea(options.onlyHPC);

    $("#pleaseZoom").toggle(isBigArea);
    if (isBigArea) {
      this.map.clearMarkers();
      return;
    }

    this.toggleLoading(true);
    try {
      const stations = await this.goingElectric.getStations(bounds.northEast, bounds.southWest, options);
      this.map.clearMarkers();
      stations.forEach(st => this.map.addStation(st, this.stationSelected.bind(this)));
    } catch (ex) {
      this.showAlert("Stationen konnten nicht geladen werden.");
    }
    this.toggleLoading(false);
  }

  async stationSelected(model) {
    ga('send', 'event', 'Station', 'show');
    this.toggleLoading(true);
    try {
      const station = await this.goingElectric.getStationDetails(model.id);
      this.currentStationTariffs = await this.stationTariffs.getTariffsOfStation(station);
      this.currentStationTariffs.station = station;
      this.sidebar.showStation(station, this.chargingOptions());
      this.selectedConnectorChanged();
    } catch (ex) {
      this.showAlert("Preise konnten nicht geladen werden.");
    }

    this.toggleLoading(false);
  }

  selectedConnectorChanged() {
    const options = this.chargingOptions();
    if (options.connectorId == null) return;

    const st = this.currentStationTariffs;

    const prices = st.availableTariffs.map(tariff => {
      const price = new CalculatePrice(st.station, tariff, options).run();
      if (price != null) return { tariff: tariff, price: price };
    }).filter(p => p);

    this.sidebar.updateStationPrice(this.currentStationTariffs.station, prices, options);
  }

  showAlert(message) {
    $("#snackbar").text(message);
    $("#snackbar").show();

    setTimeout(() => $("#snackbar").hide(), 5000);
  }
}

var app = new App();

$(document).ready(() => app.initialize());

function placesReady() {
  app.initialize();
}