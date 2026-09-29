import FetchValidAccessToken from './fetchValidAccessToken';
import { version } from '../../package.json';

const BASE_URL = "https://cms.chargeprice.app/userFeedback";

// Opens the web based feedback forms, see chargeprice-api-docs/guides/user_feedback.md
export default class OpenFeedbackForm {
  constructor(depts, userSettings){
    this.depts = depts;
    this.translation = depts.translation();
    this.analytics = depts.analytics();
    this.userSettings = userSettings;
  }

  wrongPrice(station, chargePoint, tariffId){
    this.open("wrongPrice", { poiId: station.id, tariffId: tariffId, plug: chargePoint.plug, power: chargePoint.power });
  }

  missingPrice(station, chargePoint){
    this.open("stationFeedbackOrMissingPrice", { poiId: station.id, plug: chargePoint.plug, power: chargePoint.power });
  }

  missingStation(location){
    this.open("missingStation", { longitude: location.longitude, latitude: location.latitude });
  }

  missingVehicle(){
    this.open("missingVehicle", {});
  }

  other(){
    this.open("other", {});
  }

  open(form, params){
    this.analytics.log('event', 'feedback_form_opened', { form: form });

    // Browsers only allow new tabs directly within a click, but getting the user token can
    // take a request (token refresh). So the tab is opened right away and navigated afterwards.
    const tab = window.open("", "_blank");
    if(tab) tab.opener = null;

    this.buildUrl(form, params).then(url=>{
      if(tab) tab.location.href = url;
      else window.open(url, "_blank");
    });
  }

  async buildUrl(form, params){
    const query = new URLSearchParams({
      lang: this.translation.currentLocaleOrFallback(),
      appPlatform: "web",
      appVersion: version
    });

    const products = ((this.userSettings && this.userSettings.meta) || {}).products || [];
    if(products.length > 0) query.set("userProducts", products.join(","));

    for(const key in params){
      if(params[key] != null) query.set(key, params[key]);
    }

    try {
      query.set("userToken", await new FetchValidAccessToken(this.depts).run());
    }
    catch(error){
      // Not logged in, the forms also work without a user
    }

    return `${BASE_URL}/${form}?${query.toString()}`;
  }
}
