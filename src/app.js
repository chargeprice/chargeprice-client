import FetchStations from './useCase/fetchStations.js';
import ShowPopUpOnStart from './useCase/showPopUpOnStart'
import StationTariffs from './repository/station_tariffs.js';
import ThemeLoader from './component/theme_loader.js';
import Map from './component/map.js';
import Sidebar from './component/sidebar.js';
import InfoSidebar from './component/infoSidebar.js';
import PricesSidebar from './component/pricesSidebar.js';
import SettingsSidebar from './views/settingsSidebar.js';
import LocationSearch from './component/location_search.js';
import Dependencies from './helper/dependencies';
import RootContainer from './views/rootContainer';
import AppInstall from './component/app_install';
import 'nouislider/distribute/nouislider.css';
import '../assets/css/w3.css'
import '../assets/css/w3-colors-flat.css'
import '../assets/css/leaflet.awesome-markers.css'
import '../assets/css/style.css'

class App {
  constructor() {
    this.fallBackLocation = {
      longitude: 11.6174228,
      latitude: 47.5399148
    };
  }

  async initialize(){
    this.depts = new Dependencies();
    
    // First Load translations
    this.translation = this.depts.translation();
    await this.translation.setCurrentLocaleTranslations();
    this.translation.translateMeta();

    // Static content is needed for almost everything else
    const settingsSidebar = new SettingsSidebar(this.depts);
    this.rootContainer = new RootContainer(this.depts);
    this.loadStaticContent(this.rootContainer,settingsSidebar);

    new ThemeLoader(this.translation).setCurrentTheme();

    this.analytics = this.depts.analytics();
    this.stationTariffs = new StationTariffs(this.depts);
    this.map = new Map(this.depts);
    this.sidebar = new Sidebar(this.depts);
    this.locationSearch = new LocationSearch(this.depts);
    this.locationSearch.render();

    this.currentStationTariffs = null;
    this.currentStation = null;

    settingsSidebar.inject(this.sidebar);
    this.rootContainer.inject(this.sidebar);

    if (!navigator.geolocation) {
      this.showFallbackLocation();
    }

    this.map.onBoundsChanged(this.showStationsAtLocation.bind(this));
    this.sidebar.onOptionsChanged(this.optionsChanged.bind(this));
    this.sidebar.stationPrices.onBatteryRangeChanged(()=>this.updatePrices());
    this.sidebar.stationPrices.onStartTimeChanged(()=>this.updatePrices());
    this.sidebar.stationPrices.onSelectedChargePointChanged(this.selectedChargePointChanged.bind(this));
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
    if (poiId != null && poiSource != null) {
      this.poiId = poiId;
      this.poiSource = poiSource;
      this.analytics.log('send', 'event', 'PoiDeeplink', poiSource);
    } else {
      this.showFallbackLocation();
      this.getCurrentLocation();
      new ShowPopUpOnStart(this.depts).run();
      
      this.sidebar.showSettingsOnStart();
    }
  }

  loadStaticContent(rootContainer, settingsSidebar){
    rootContainer.render();
    settingsSidebar.render();
    new InfoSidebar(this.depts).render();
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
    this.map.centerLocation(this.fallBackLocation,8);
  }
  
  async showStationById(poiId, poiSource) {
    this.stationSelected({
      id: poiId,
      lite: true,
      dataAdapter: poiSource,
      charge_points: []
    }, ">3.7", true)
  }

  async showStationsAtLocation(bounds) {
    if(!bounds) return; // Map not ready yet

    const options = this.sidebar.chargingOptions();

    const isBigArea = this.map.isBigArea(options.minPower);

    this.rootContainer.togglePleaseZoom(isBigArea);

    this.map.rerender();
    
    if(isBigArea){
      this.map.clearMarkers();
      return;
    }

    await this.withNetwork(async ()=>{
      const stations = await (new FetchStations(this.depts)).list(bounds.northEast, bounds.southWest,options);
      this.map.clearMarkers();
      stations.forEach(st => this.map.addStation(st, this.stationSelected.bind(this)));
    },this.translation.get("errorStationsUnavailable"));
  }

  async stationSelected(model,powerType,updateMap) {
    if(!model.lite) {
      // If CP was opened by Deeplink, don't track the station
      // Look at PoiDeeplink instead
      this.analytics.log('send', 'event', 'Station', powerType);
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
    this.selectedChargePointChanged();

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
      this.showStationById(this.poiId, this.poiSource);
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
