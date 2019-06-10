
import JsonApiDeserializer from '../helper/json_api_deserializer.js'

export default class StationTariffs {

  constructor(){
    const useLocalData = true;
    const isRunningLocally = window.location.href.indexOf("127.0.0.1") != -1
    this.base_url = useLocalData && isRunningLocally ? "http://localhost:9292" : "https://api.plugchecker.com";
    this.apiKey = process.env.CHARGEPRICE_API_KEY;
  }

  async getTariffsOfStation(station,options){

    const url = `${this.base_url}/v1/charge_prices`;
    const body = this.buildJsonApiRequestBody(station,options);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      },
      body: body,
    })
    
    if(response.status != 200) throw "Error in request";

    const root = await response.json();
    return new JsonApiDeserializer(root).deserialize();
  }

  async getAllTariffs(){
    const url = `${this.base_url}/v1/tariffs?filter[direct_payment]=false`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      }
    })
    
    if(response.status != 200) throw "Error in request";

    const root = await response.json();
    return new JsonApiDeserializer(root).deserialize();
  }

  async check(){
    const url = `${this.base_url}/check`
    try {
      await fetch(url);
    }
    catch(ex) {}
  }

  buildJsonApiRequestBody(station,options){
    return JSON.stringify({
      data: {
        type: "charge_price_request",
        attributes: {
          data_adapter: "going_electric",
          station: {
            latitude: station.latitude,
            longitude: station.longitude,
            network: station.network,
            country: station.country,
            charge_points: station.chargePoints
          },
          options: {
            energy: options.kwh,
            duration: options.duration,
            car_ac_phases: options.carACPhases,
            provider_customer_tariffs: options.providerCustomerTarrifs
          },
          charge_card_ids: station.chargeCardIds,
        },
        relationships: this.buildRelationships(station,options)
      } 
    });
  }

  buildRelationships(station, options){
    const rels = {};
    if(options.onlyShowMyTariffs && options.myTariffs.length > 0){
      const tariffRefs = options.myTariffs.map(t=>{ return {id: t.id, type: t.type } }) ;
      rels["tariffs"]={ data: tariffRefs };
    }
    return rels;
  }
}