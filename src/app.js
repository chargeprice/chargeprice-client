import FetchStations from './useCase/fetchStations.js';
import ShowPopUpOnStart from './useCase/showPopUpOnStart'
import StationTariffs from './repository/station_tariffs.js';
import ThemeLoader from './component/theme_loader.js';
import Map, { defaultLocations } from './component/map.js';
import Sidebar from './component/sidebar.js';
import InfoSidebar from './component/infoSidebar.js';
import PricesSidebar from './component/pricesSidebar.js';
import SettingsSidebar from './views/settingsSidebar.js';
import LocationSearch from './component/location_search.js';
import Dependencies from './helper/dependencies';
import RootContainer from './views/rootContainer';
import AppInstall from './component/app_install';
import '../assets/css/w3.css'
import '../assets/css/w3-colors-flat.css'
import '../assets/css/leaflet.awesome-markers.css'
import '../assets/css/MarkerCluster.css'
import '../assets/css/style.css'

class App {
  async initialize(){
    this.depts = Dependencies.getInstance();

    // First Load translations
    this.translation = this.depts.translation();
    await this.translation.setCurrentLocaleTranslations();
    this.translation.translateMeta();

    // Static content is needed for almost everything else
    const settingsSidebar = new SettingsSidebar(this.depts);
    const infoSidebar = new InfoSidebar(this.depts);
    this.rootContainer = new RootContainer(this.depts);
    await this.loadStaticContent(this.rootContainer,settingsSidebar, infoSidebar);

    this.depts.themeLoader().initializeTheme();

    this.analytics = this.depts.analytics();
    this.stationTariffs = new StationTariffs(this.depts);
    this.map = new Map(this.depts);
    this.sidebar = new Sidebar(this.depts);
    this.locationSearch = new LocationSearch(this.depts);
    this.locationSearch.render();

    this.currentStationTariffs = null;
    this.currentStation = null;

    settingsSidebar.inject(this.sidebar);
    infoSidebar.inject(this.map);
		this.sidebar.injectMap(this.map);
    this.rootContainer.inject(this.sidebar);

    if (!navigator.geolocation) {
      this.showFallbackLocation();
    }

    this.map.onBoundsChanged(this.showStationsAtLocation.bind(this));
    this.sidebar.onOptionsChanged(this.optionsChanged.bind(this));
    this.sidebar.stationPrices.onBatteryRangeChanged(()=>this.updatePrices());
    this.sidebar.stationPrices.onStartTimeChanged(()=>this.updatePrices());
    this.sidebar.stationPrices.onSelectedChargePointChanged(()=>this.selectedChargePointChanged());
    this.locationSearch.onResultSelected(coords=>{
      this.map.centerLocation(coords);
      this.map.setSearchLocation(coords);
    });
    this.locationSearch.onCenterMyLocation(()=>{
      this.map.centerMyLocation();
      this.getCurrentLocation();
    });

    this.redirectLegacyUrls();
    new AppInstall().registerServiceWorker();

    var params = new URL(window.location.href).searchParams;
    this.deeplinkActivated = false;
    const poiId = params.get("poi_id")
    const poiSource = params.get("poi_source")

		if (params.has('access_token') && params.has('refresh_token')) {
			const settings = this.depts.settingsPrimitive();
			const access_token = params.get('access_token');
			const refresh_token = params.get('refresh_token');

			settings.authTokens().set({
					accessToken: access_token,
					refreshToken: refresh_token,
			});

			params.delete('access_token');
			params.delete('refresh_token');

			location.search = params.toString();
		}

    if (poiId != null && poiSource != null) {
      this.poiId = poiId;
      this.poiSource = poiSource;
      this.analytics.log('event', 'poi_deeplink_opened', { poi_source: poiSource });
    } else {
      this.showFallbackLocation();
      this.getCurrentLocation();
      new ShowPopUpOnStart(this.depts).run();

      this.sidebar.showSettingsOnStart();
    }
  }

  async loadStaticContent(rootContainer, settingsSidebar, infoSidebar){
    await rootContainer.render();
    settingsSidebar.render();
    infoSidebar.render();
    new PricesSidebar(this.depts).render();
  }

  getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.map.centerLocation(pos.coords);
        this.map.watchLocation();
        this.map.setMyLocation(pos.coords);
      },
      () => this.showFallbackLocation());
  }

  showFallbackLocation() {
		let fallBackLocation = null;

		switch (this.translation.currentLocale) {
			case 'fr': {
				fallBackLocation = defaultLocations.PARIS;
        break;
			}
			default: {
				fallBackLocation = defaultLocations.SALZBURG;
				break;
			}
		}

    this.map.centerLocation(fallBackLocation,12);
  }

  async showStationsAtLocation(bounds) {
    if(!bounds) return; // Map not ready yet

    const options = this.sidebar.chargingOptions();

    options.minPower = this.map.minPowerOfStations(options.minPower);
    this.map.rerender();

    await this.withNetwork(async ()=>{
      const stations = await (new FetchStations(this.depts)).list(bounds.northEast, bounds.southWest,options);
      this.map.clearMarkers();
      this.map.toggleClustering(stations.length);
      stations.forEach(st => this.map.addStation(st, (model)=>this.stationSelected(model,false)));
    },this.translation.get("errorStationsUnavailable"));
  }

  async stationSelected(model,updateMap) {
    if(!model.lite) {
      // If CP was opened by Deeplink, don't track the station
      // Look at PoiDeeplink instead
      const maxPower = model.chargePoints.reduce((memo,cp)=>cp.power > memo ? cp.power : memo,0);
      const country = model.country;
      const cpoName = model.network;
      this.analytics.log('event', 'station_opened',{max_power: maxPower, cpo: cpoName, country: country});
    }

    await this.withNetwork(async ()=>{
      const options = this.sidebar.chargingOptions();
      this.currentStation = await (new FetchStations(this.depts)).detail(model, options);
    },this.translation.get("errorStationsUnavailable"));

    if (updateMap) {
      this.map.centerLocation({
        latitude: this.currentStation.latitude,
        longitude: this.currentStation.longitude
      });
      this.map.changeSelectedStation(this.currentStation)
    }

    await this.updatePrices();
    this.sidebar.showStation(this.currentStation);

    this.depts.urlModifier().modifyUrlParam({poi_id: this.currentStation.id, poi_source: this.currentStation.dataAdapter})
  }

  async updatePrices() {
    await this.withNetwork(async ()=>{
      const options = this.sidebar.chargingOptions();
      const result = await this.stationTariffs.getTariffsOfStation(this.currentStation,options);
      this.currentStationTariffs = result.data;
      this.currentStationMeta = result.meta;
      this.selectedChargePointChanged();
    },this.translation.get("errorPricesUnavailable"));
  }

  async withNetwork(func,errorMsg){
    this.rootContainer.toggleLoadingIndicator(true);
    try{
      await func();
    }
    catch(ex){
      this.rootContainer.showAlert(errorMsg);
      console.error(ex);
    }

    this.rootContainer.toggleLoadingIndicator(false);
  }

  selectedChargePointChanged(){
    const options = this.sidebar.chargingOptions();
    const selectedCP = options.chargePoint;
    if(selectedCP==null) return;

    const cpDurationAndEnergy = this.findBySelectedChargePoint(this.currentStationMeta.charge_points, selectedCP);
    if(cpDurationAndEnergy == null) return;
    options.chargePointDuration = cpDurationAndEnergy.duration
    options.chargePointEnergy = cpDurationAndEnergy.energy

    const prices = this.currentStationTariffs.reduce((memo,tariff)=>{
      const chargePointPrice = this.findBySelectedChargePoint(tariff.chargePointPrices, selectedCP);

      if(chargePointPrice) {
        const pricePerKWh = chargePointPrice.price / cpDurationAndEnergy.energy;
        memo.push({
          price: chargePointPrice.price,
          pricePerKWh: pricePerKWh,
          distribution: chargePointPrice.price_distribution,
          blockingFeeStart: chargePointPrice.blocking_fee_start,
          noPriceReason: chargePointPrice.no_price_reason,
          tariff: tariff });
      }
      return memo;
    },[]);

    this.sidebar.updateStationPrice(this.currentStation,prices,options);
  }

  findBySelectedChargePoint(list,selectedCP){
    return list.find(cpp=> cpp.power == selectedCP.power && cpp.plug == selectedCP.plug);
  }

  optionsChanged(){
    if (this.poiId !== undefined && this.poiSource !== undefined && !this.deeplinkActivated) {
      this.deeplinkActivated = true;
      this.stationSelected({id: this.poiId, lite: true, dataAdapter: this.poiSource, charge_points: [] }, true)
    }
    this.showStationsAtLocation(this.map.getBounds());
  }

  redirectLegacyUrls(){
    const isLegacyUrl = window.location.host == "www.plugchecker.com" ||
      window.location.host == "laden.isvoi.org";

    if(isLegacyUrl) {
      window.location = "https://www.chargeprice.app";
    }
  }
}

new App().initialize();
