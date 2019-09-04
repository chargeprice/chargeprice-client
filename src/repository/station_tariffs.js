
import JsonApiDeserializer from '../helper/json_api_deserializer.js'

export default class StationTariffs {

  constructor(){
    const useLocalData = true;
    const isRunningLocally = window.location.href.indexOf("127.0.0.1") != -1
    this.base_url = useLocalData && isRunningLocally ? "http://localhost:9292" : "https://api.chargeprice.app";
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

    return new JsonApiDeserializer(response).deserialize();
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

    return new JsonApiDeserializer(response).deserialize();
  }

  async getAllVehicles(){
    const url = `${this.base_url}/v1/vehicles`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      }
    })
    
    if(response.status != 200) throw "Error in request";

    return await new JsonApiDeserializer(response).deserialize();
  }

  buildJsonApiRequestBody(station,options){
    const jsonOptions = {
      provider_customer_tariffs: options.providerCustomerTarrifs
    }

    if(options.myVehicle){
      jsonOptions["battery_range"] = options.batteryRange
    }
    else {
      jsonOptions["energy"] = options.kwh
      jsonOptions["duration"] = options.duration
    }

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
            charge_points: station.chargePoints.filter(cp=>cp.supportedByVehicle)
          },
          options: jsonOptions,
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
    if(options.myVehicle){
      rels["vehicle"] = {
        data: { 
          id: options.myVehicle.id, 
          type: options.myVehicle.type
        }
      }
    }
    return rels;
  }
}