
import JsonApiDeserializer from '../helper/json_api_deserializer.js'
import JsonApiSerializer from '../helper/jsonApiSerializer.js'

export default class StationTariffs {

  constructor(depts){
    this.translation = depts.translation();
    this.base_url = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;

    this.defaultPlugs = ["type1","type2","schuko","type3"];
  }

  async getTariffsOfStation(station,options){

    const url = `${this.base_url}/v1/charge_prices`;
    const body = this.buildJsonApiRequestBody(station,options);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": this.translation.currentLocaleOrFallback(),
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

    if(options.cpoFilterChargeprice){
      query["filter[operator.id]"] = options.cpoFilterChargeprice;
    }

    if(options.minPower) query["filter[charge_points.power.gte]"] = options.minPower;

    if(options.myVehicle){
      query["filter[charge_points.plug.in]"]= this.defaultPlugs.concat(options.myVehicle.dcChargePorts);
    }

    if(options.onlyFree){
      query["filter[free_charging]"] = true;
    }

    const myEmpIds = options.myTariffs.filter(t=>t.emp).map(t=>t.emp.id);
    if(options.onlyShowMyTariffs && myEmpIds.length > 0){
      query["filter[operator.supported_emps.id]"]=myEmpIds.join(",")
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
    const stations = apiResponse.data.map(station=>this.toStationDetailModel(station, options));
    return { stations: stations, meta: apiResponse.meta };
  }

  async getStationDetails(id,options){
    const url = `${this.base_url}/v1/charging_stations/${id}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      }
    })
    
    if(response.status != 200) throw "Error in request";

    const apiResponse = await (new JsonApiDeserializer(response)).deserialize();
    return this.toStationDetailModel(apiResponse.data, options);
  }

  async postUserFeedback(feedback){
    const url = `${this.base_url}/v1/user_feedback`;
    const body = new JsonApiSerializer(feedback).serialize();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      },
      body: JSON.stringify(body),
    })
    if(response.status != 204) throw "Error in request";
  }

  buildJsonApiRequestBody(station,options){
    const jsonOptions = {
      currency: options.displayedCurrency,
      allow_unbalanced_load: options.allowUnbalancedLoad,
      provider_customer_tariffs: (options.providerCustomerTariffs),
      start_time: options.startTime,
      show_price_unavailable: true
    }

    if(options.onlyTariffsWithoutMonthlyFees){
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
        relationships: this.buildRelationships(station,options)
      }
    });
  }

  buildRelationships(station, options){
    const tariffRefs = options.myTariffs.map(t=>{ return {id: t.id, type: t.type } }) ;
    const rels = {
      tariffs: { data: tariffRefs, meta: { include: options.onlyShowMyTariffs ? "exclusive" : "always" } }
    };
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
      faultReported:     false
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