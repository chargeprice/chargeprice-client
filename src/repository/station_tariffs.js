
import JsonApiDeserializer from '../helper/json_api_deserializer.js'

export default class StationTariffs {

  constructor(){
    const useLocalData = true;
    const isRunningLocally = window.location.href.indexOf("127.0.0.1") != -1
    this.base_url = useLocalData && isRunningLocally ? "http://localhost:9292" : "https://api.chargeprice.app";
    this.apiKey = process.env.CHARGEPRICE_API_KEY;

    this.defaultPlugs = ["type1","type2","schuko"];
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

  async getStations(northEast, southWest,options){

    const query = {}
    query["filter[latitude.gte]"] = southWest.latitude;
    query["filter[latitude.lte]"] = northEast.latitude;
    query["filter[longitude.gte]"] = southWest.longitude;
    query["filter[longitude.lte]"] = northEast.longitude;

    if(options.onlyHPC) query["filter[charge_points.power.gte"] = 43;

    if(options.myVehicle){
      query["filter[charge_points.plug.in]"]= this.defaultPlugs.concat(options.myVehicle.dcChargePorts);
    }

    const url = `${this.base_url}/v1/charging_stations?${this.toQuery(query)}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      }
    })
    
    if(response.status != 200) throw "Error in request";

    const apiResponse = await (new JsonApiDeserializer(response)).deserialize();
    return apiResponse.data.map(station=>this.toStationDetailModel(station, options));
  }

  buildJsonApiRequestBody(station,options){
    const hasOwnTariffs = options.onlyShowMyTariffs && options.myTariffs.length > 0;

    const jsonOptions = {
      allow_unbalanced_load: options.allowUnbalancedLoad,
      provider_customer_tariffs: (options.providerCustomerTarrifs || hasOwnTariffs)
    }

    if(options.onlyTariffsWithoutMonthlyFees && !hasOwnTariffs){
      jsonOptions.max_monthly_fees = 0;
    }

    if(options.myVehicle){
      jsonOptions.battery_range = options.batteryRange
    }
    else {
      jsonOptions.energy = options.kwh
      jsonOptions.duration = options.duration
    }

    return JSON.stringify({
      data: {
        type: "charge_price_request",
        attributes: {
          data_adapter: station.dataAdapter,
          station: {
            latitude: station.latitude,
            longitude: station.longitude,
            network: station.networkId,
            country: station.country,
            charge_points: station.chargePoints.filter(cp=>cp.supportedByVehicle)
          },
          options: jsonOptions,
          charge_card_ids: station.chargeCardIds || [],
        },
        relationships: this.buildRelationships(station,options, hasOwnTariffs)
      }
    });
  }

  buildRelationships(station, options, hasOwnTariffs){
    const rels = {};
    if(hasOwnTariffs){
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

  toStationDetailModel(data, options){

    const vehicle = options.myVehicle;

    return {
      dataAdapter:       "chargeprice",
      id:                data.id,
      name:              data.name,
      network:           (data.operator || {}).name,
      networkId:         (data.operator || {}).id,
      address:           data.address,
      longitude:         data.longitude,
      latitude:          data.latitude,
      isFreeCharging:    data.freeCharging,
      isFreeParking:     data.freeParking,
      priceDescription:  "",
      country:           data.country,
      chargePoints:      data.chargePoints.map((cp,idx) => this.parseChargePoint(cp,idx, vehicle)),
    }
  }

  parseChargePoint(hash,idx, vehicle){
    return {
      id: String(idx), 
      power: hash.power,
      plug:  hash.plug,
      count: hash.count,
      supportedByVehicle: this.supportedCharger(vehicle, hash)
    }
  }

  supportedCharger(vehicle, hash){
    if(!vehicle){
      return true;
    }
    else {
      const isDefaultPort = this.defaultPlugs.includes(hash.plug);
      const isSupportedFastCharger = vehicle.dcChargePorts.includes(hash.plug);
  
      return isDefaultPort || isSupportedFastCharger;
    }
  }

  toQuery(hash) {
    var esc = encodeURIComponent;
    return Object.keys(hash).map(k => esc(k) + '=' + esc(hash[k])).join('&');
  }
}