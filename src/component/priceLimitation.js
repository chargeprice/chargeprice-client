import { html, render } from 'lit-html';
import ViewBase from './viewBase';

export default class PriceLimitation extends ViewBase {
  constructor(depts) {
    super(depts);
    this.analytics = depts.analytics();
    this.themeLoader = depts.themeLoader();
		this.settings = this.depts.settingsPrimitive();
    this.customConfig = depts.customConfig();
    this.translation = depts.translation();
    this.stationCounterKey = "stationCounter";
    
    this.todayString = new Date().toISOString().split("T")[0];
    this.todayStartingCounter = {
      date: this.todayString,
      stations: []
    };

    this.playLink = "https://play.google.com/store/apps/details?id=fr.chargeprice.app";
    this.iosLink = "https://apps.apple.com/us/app/chargeprice/id1552707493";

    this.maxFreePriceChecks = 8;
  }

  template(){
    return html`
      <div class="w3-margin-top w3-small w3-container">
      <div class="w3-margin-top w3-small w3-container price-row w3-medium" style="font-family: 'Open Sans';">
        <label class="w3-block w3-large w3-center" style="font-family: 'Merriweather Sans'; font-weight: 300; border-bottom: 1px solid #aaa;">
          ${this.t("priceLimitReachedHeader")}
        </label>
        <label class="w3-block w3-padding">
          ${this.sf(this.t("priceLimitReachedText"),this.maxFreePriceChecks)}
        </label>

        <label class="w3-block w3-large w3-center w3-margin-top" style="font-family: 'Merriweather Sans'; font-weight: 300;">
          <i class="fa fa-bolt"></i> ${this.t("priceLimitEvDriverHeader")}
        </label>
      
        <label class="w3-block w3-center w3-padding">${this.t("priceLimitEvDriverText")}</label>
        <div class="w3-container w3-padding">
          <div class="w3-half w3-center">
            <button @click="${()=>this.onDownloadApp(this.playLink,"android")}" class="w3-btn pc-secondary">
              <i class="fab fa-google-play"></i> Android
            </button>
          </div>
          <div class="w3-half w3-center">
            <button @click="${()=>this.onDownloadApp(this.iosLink,"ios")}" class="w3-btn pc-secondary">
              <i class="fab fa-apple"></i> iPhone
            </button>
          </div>
        </div>

        <label class="w3-block w3-large w3-center w3-margin-top" style="font-family: 'Merriweather Sans'; font-weight: 300;">
          <i class="fa fa-chart-line"></i> ${this.t("priceLimitProHeader")}
        </label>
        <label class="w3-block w3-center w3-padding">${this.t("priceLimitProText")}</label>
        ${this.ut("priceLimitProFeatureList")}

        <center>
          <button @click="${()=>this.onGoToPro()}" class="w3-btn pc-secondary w3-margin-bottom">
            ${this.t("priceLimitProCTA")}
          </button>
        </center>
        
      </div>
    `;
  }

  isDisplayed(station, isProUser){
    const limitReached = this.dailyLimitReached();
    const internalMode = this.customConfig.isInternalMode();
    const isMobile = this.customConfig.isMobileOrTablet();
    const isWhiteLabel = !this.themeLoader.isDefaultTheme();
    const isDeepLinkOpened = this.isDeepLinkOpened(station);
    const isDanishUser = this.translation.currentLocaleOrFallback() == "da";

    const limitExceptions = internalMode || isMobile || isWhiteLabel || isDeepLinkOpened || isDanishUser

    if((limitExceptions && !limitReached) || isProUser) return false;

    const currentCount = this.incrementStationCounterAndGetCurrentCount(station);

    if(currentCount == this.maxFreePriceChecks + 1){
      const appStartCount = this.settings.getAppStartCount();
      this.analytics.log('event', 'price_list_limit_reached', { app_start_count: appStartCount });
    }

    return currentCount > this.maxFreePriceChecks;
  }

  incrementStationCounterAndGetCurrentCount(station){
    const stationGlobalID = station.dataAdapter + "_" + station.id;
    const counter = this.settings.getObject(this.stationCounterKey, {});

    if(counter.date != this.todayString){
      // Reset counter
      counter.date = this.todayString;
      counter.stations = [];
    }
    else if(!counter.stations.includes(stationGlobalID)){
      // Allow to check the same station multiple times
      counter.stations.push(stationGlobalID);
    }

    this.settings.setObject(this.stationCounterKey, counter);

    return counter.stations.length;
  }

  dailyLimitReached(){
    const counter = this.settings.getObject(this.stationCounterKey, { });
    return counter.date == this.todayString && counter.stations.length > this.maxFreePriceChecks;
  }

  isDeepLinkOpened(station){
    const deeplinkStation = this.settings.getLastDeeplinkStation(this.poiId, this.poiSource);
    return deeplinkStation && deeplinkStation.id == station.id && deeplinkStation.dataAdapter == station.dataAdapter;
  }

  render(elementId){
    render(this.template(),document.getElementById(elementId));
  }

  onDownloadApp(appLink,platform){
    window.open(appLink,"_blank");
    this.analytics.log('event', 'app_install_price_list_limit_clicked',{platform: platform});
  }

  onGoToPro(){
    window.open("https://www.chargeprice.net/quotes","_blank");
    this.analytics.log('event', 'go_to_pro_price_list_limit_clicked');
  }
}

