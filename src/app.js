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
import LandingPage from './views/landing';
import PromoPage from './views/promo';
import AppInstall from './component/app_install';
import FetchUserSettingsOrCreateFromLocal from './useCase/fetchUserSettingsOrCreateFromLocal.js';
import ModalInstallApp from './modal/installApp.js';
import MapAd from './component/mapAd.js';
import PremiumGate, { PREMIUM_PATH } from './component/premiumGate.js';

import '../assets/css/w3.css'
import '../assets/css/w3-colors-flat.css'
import '../assets/css/leaflet.awesome-markers.css'
import '../assets/css/style.css'

class App {
  async initialize(){
    this.depts = Dependencies.getInstance();

    // First Load translations
    this.translation = this.depts.translation();
    await this.translation.setCurrentLocaleTranslations();
    this.translation.translateMeta();

    // Load user settings to have it cached
    this.userSettings = await new FetchUserSettingsOrCreateFromLocal(this.depts).run();

    this.redirectLegacyUrls();
    new AppInstall().registerServiceWorker();

    this.depts.router()
      .on({
        "/map": () => this.showRoute("/map", () => this.initializeMapApp(this.userSettings)),
        [PREMIUM_PATH]: () => this.showRoute("/map", () => this.initializeMapApp(this.userSettings)),
        "/welcome": () => this.showRoute("/welcome", () => this.showLandingPage()),
        "/promo": () => this.showRoute("/promo", () => this.showPromoPage()),
        // e.g. /promo/SUMMER24 prefills the promo code
        "/promo/:code": (match) => this.showRoute("/promo", () => this.showPromoPage(match.data.code))
      })
      .notFound(() => this.navigateToDefaultRoute());

    if(window.location.pathname === "/"){
      this.navigateToDefaultRoute();
    } else {
      this.depts.router().resolve();
    }
  }

  // Navigo re-resolves a route when only its query string changed (e.g. after the
  // poi_id deeplink params got removed), which would re-initialize the whole page.
  showRoute(path, handler){
    if(this.currentRoute === path) return;
    this.currentRoute = path;
    handler();
  }

  navigateToDefaultRoute(){
    const params = new URL(window.location.href).searchParams;
    const hasDeepLink = (params.has('poi_id') && params.has('poi_source'))
      || (params.has('access_token') && params.has('refresh_token'))
      || params.has('deeplink_target');
    const isDefaultTheme = this.depts.themeLoader().isDefaultTheme();
    const askedForTracking = this.depts.settingsPrimitive().getBoolean("askedForTracking", false);
    const goStraightToMap = hasDeepLink || !isDefaultTheme || askedForTracking;

    this.depts.router().navigate(goStraightToMap ? "/map" : "/welcome");
  }

  showLandingPage(){
    new LandingPage(this.depts).render();
  }

  showPromoPage(promoCode){
    new PromoPage(this.depts, promoCode).render();
  }

  async initializeMapApp(userSettings){
    document.documentElement.classList.remove("landing-page");
    document.body.classList.remove("landing-page");

    // Static content is needed for almost everything else
    const settingsSidebar = new SettingsSidebar(this.depts, userSettings);
    const infoSidebar = new InfoSidebar(this.depts);
    this.rootContainer = new RootContainer(this.depts, userSettings);
    await this.loadStaticContent(this.rootContainer,settingsSidebar, infoSidebar);

    this.depts.themeLoader().initializeTheme();

    this.analytics = this.depts.analytics();
    this.stationTariffs = new StationTariffs(this.depts);
    this.map = new Map(this.depts);
    this.sidebar = new Sidebar(this.depts, userSettings);
    this.locationSearch = new LocationSearch(this.depts);
    this.locationSearch.render();
    this.settings = this.depts.settingsPrimitive();

    this.currentStationTariffs = null;
    this.currentStation = null;
    this.stationsRequestId = 0;

    this.map.setHighlightPromoted(!this.sidebar.premiumGate.isPremium());
    this.mapAd = new MapAd(this.depts, this.sidebar.premiumGate);
    this.initializeTrips();
    settingsSidebar.inject(this.sidebar);
    infoSidebar.inject(this.map, this.sidebar);
		this.sidebar.injectMap(this.map);
    this.rootContainer.inject(this.sidebar);

    //Make sure theme is loaded now
    infoSidebar.render();

    if (!navigator.geolocation) {
      this.showFallbackLocation();
    }

    this.map.onBoundsChanged(()=>this.scheduleStationsUpdate());
    this.sidebar.onOptionsChanged(this.optionsChanged.bind(this));
    this.sidebar.onReturnedToStation(()=>this.returnedToStation());
    this.sidebar.settingsView.onBatteryRangeChanged(()=>{
      this.updatePrices();
      // The prices on the map also depend on the battery range
      this.scheduleStationsUpdate();
    });
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

    // Stations only come from Chargeprice, old deeplinks to other sources (e.g. GoingElectric) are ignored
    if (poiId != null && poiSource == "chargeprice") {
      this.poiId = poiId;
      this.poiSource = poiSource;
      this.analytics.log('event', 'poi_deeplink_opened', { poi_source: poiSource });
    } else {
      this.showFallbackLocation();
      this.getCurrentLocation();
      new ShowPopUpOnStart(this.depts).run();

      this.sidebar.showSettingsOnStart();
    }

    if(params.has("deeplink_target")){
      new ModalInstallApp(this.depts).show();
    }

    if(window.location.pathname === PREMIUM_PATH) this.showPremiumScreenFromUrl();
  }

  // Also the target after the Stripe checkout (?checkoutSuccess=true/false)
  showPremiumScreenFromUrl(){
    const premiumGate = this.sidebar.premiumGate;
    const params = new URL(window.location.href).searchParams;
    const checkoutSuccess = params.get("checkoutSuccess");
    if(checkoutSuccess != null){
      // The result is shown once, not again after a reload
      params.delete("checkoutSuccess");
      const query = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : "") + window.location.hash);
    }

    // White labels have no premium screen
    if(!this.depts.themeLoader().isDefaultTheme()){
      PremiumGate.onPremiumScreenClosed();
      return;
    }

    const checkoutResult = checkoutSuccess == null ? null : (checkoutSuccess == "true" ? "success" : "cancelled");
    premiumGate.showPremiumScreen(checkoutResult ? "checkout_result" : "url", { checkoutResult });
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
        this.sidebar.routePlanner.setCurrentLocation(pos.coords);
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
      case 'da': {
				fallBackLocation = defaultLocations.COPENHAGEN;
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
    // While a trip is shown, only the stations of the trip are on the map
    if(this.tripActive) return;

    const options = this.sidebar.chargingOptions();

    options.minPower = this.map.minPowerOfStations(options.minPower);
    this.map.rerender();

    const requestId = ++this.stationsRequestId;

    await this.withNetwork(async ()=>{
      const result = await (new FetchStations(this.depts)).list(bounds.northEast, bounds.southWest,options);
      // Several requests run at startup (fallback location, own location, loaded settings) and can
      // finish out of order. Only the latest one may draw, otherwise stations of an old area replace the current ones.
      if(requestId != this.stationsRequestId) return;
      const stations = result.stations;
      this.map.clearMarkers();
      this.map.resetMarkers();
      this.map.showStations(stations, result.indexedPricePreviews, result.cheapestPrice, (model)=>this.stationSelected(model,false));
      this.mapAd.update(stations, {
        latitude: (bounds.northEast.latitude + bounds.southWest.latitude) / 2,
        longitude: (bounds.northEast.longitude + bounds.southWest.longitude) / 2
      });
    },this.translation.get("errorStationsUnavailable"));
  }

  initializeTrips(){
    this.tripActive = false;
    const eventBus = this.depts.eventBus();

    eventBus.subscribe("trip.created", (route)=>{
      this.tripActive = true;
      // Station requests that are still running must not draw anymore
      this.stationsRequestId++;
      this.map.clearMarkers();
      this.map.resetMarkers();
      this.map.showTrip(route, (station)=>this.tripStationSelected(station));
    });

    eventBus.subscribe("trip.deleted", ()=>{
      this.tripActive = false;
      this.map.deleteTrip();
      this.scheduleStationsUpdate();
    });

    this.sidebar.routePlanner.onChargeStopReplaced(()=>{
      this.sidebar.stationPrices.refreshStationDetails();
      // The station is now a charging stop, so its prices use the battery range of the stop
      if(this.currentStation) this.updatePrices();
    });

    this.sidebar.routePlanner.onStationSelected((station)=>{
      this.map.centerLocation(station, 14);
      this.map.changeSelectedStation(station);
      this.tripStationSelected(station);
    });
  }

  tripStationSelected(station){
    this.stationSelected({ id: station.id, lite: true, dataAdapter: "chargeprice", chargePoints: [], network: station.network }, false);
  }

  async stationSelected(model,viaDeeplink) {
    this.sidebar.stationOpenId++;

    if(!viaDeeplink) {
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

    if (viaDeeplink) {
      this.map.centerLocation({
        latitude: this.currentStation.latitude,
        longitude: this.currentStation.longitude
      });
      this.map.changeSelectedStation(this.currentStation);
    }

    await this.updatePrices();
    this.sidebar.showStation(this.currentStation);

    this.depts.urlModifier().modifyUrlParam({poi_id: this.currentStation.id, poi_source: this.currentStation.dataAdapter})
  }

  // Charging options for the current station: at a charging stop of the planned route,
  // the battery range of that stop is used instead of the one from the settings
  stationChargingOptions(){
    const options = this.sidebar.chargingOptions();
    const tripRange = this.sidebar.routePlanner.chargeStopBatteryRange(this.currentStation && this.currentStation.id);
    if(tripRange){
      options.batteryRange = tripRange;
      options.tripBatteryRange = tripRange;
    }
    return options;
  }

  async updatePrices() {
    // E.g. the battery range changed before any station was opened
    if(!this.currentStation) return;

    await this.withNetwork(async ()=>{
      const options = this.stationChargingOptions();
      const result = await this.stationTariffs.getTariffsOfStation(this.currentStation,options);
      this.currentStationTariffs = result.data;
      this.currentStationMeta = result.meta;
      this.selectedChargePointChanged();
    },this.translation.get("errorPricesUnavailable"));
  }

  async withNetwork(func,errorMsg){
    try{
      await func();
    }
    catch(ex){
      this.rootContainer.showAlert(errorMsg);
      console.error(ex);
    }
  }

  selectedChargePointChanged(){
    const options = this.stationChargingOptions();
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

  returnedToStation(){
    if(!this.currentStation) return;
    // Closing the station (to open the wallet) removed it from the URL
    this.depts.urlModifier().modifyUrlParam({poi_id: this.currentStation.id, poi_source: this.currentStation.dataAdapter});
    this.updatePrices();
  }

  optionsChanged(){
    if (this.poiId !== undefined && this.poiSource !== undefined && !this.deeplinkActivated) {
      this.deeplinkActivated = true;
      this.settings.setLastDeeplinkStation(this.poiId, this.poiSource);
      this.stationSelected({id: this.poiId, lite: true, dataAdapter: this.poiSource, charge_points: [] }, true)
    }
    this.scheduleStationsUpdate();
  }

  // At startup the map moves to the fallback location, then to the own location and the settings get loaded,
  // each triggering a reload. Waiting until these triggers settle loads the stations only once.
  scheduleStationsUpdate(){
    const delay = this.stationsLoadedOnce ? 300 : 1000;
    clearTimeout(this.stationsUpdateTimer);
    this.stationsUpdateTimer = setTimeout(()=>{
      this.stationsLoadedOnce = true;
      this.showStationsAtLocation(this.map.getBounds());
    }, delay);
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
