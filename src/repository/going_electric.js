export default class GoingElectric {

  constructor() {
    this.apiKey = process.env.GOING_ELECTRIC_API_KEY;
    this.url = "https://api.goingelectric.de/chargepoints";
    this.defaultPlugs = [
      "CEE Blau",
      "CEE Rot",
      "CEE+",
      "Schuko",
      "Typ1",
      "Typ2",
    ]
    this.plugMapping = {
      "ccs": ["CCS"],
      "chademo": ["CHAdeMO"],
      "tesla_suc": ["Tesla HPC","Tesla Supercharger"],
      "tesla_ccs": ["Tesla Supercharger CCS"]
    }
  }

  async getStations(northEast, southWest,options) {
    const body = this.buildStationsBody(northEast, southWest,options);
    let stations = []
    let result = null;

    do {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: this.encodeBody(body),
      })

      result = await this.parseStationsResponse(response, options.myVehicle);
      stations = stations.concat(result.stations);
      body.startkey = result.startKey;
    }
    while(result.startKey != null);

    return stations;
  }

  async getStationDetails(stationId,options){
    const body = { key: this.apiKey, ge_id: stationId }

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: this.encodeBody(body),
    })

    return await this.parseStationResponse(response, options.myVehicle);
  }

  buildStationsBody(northEast, southWest,options){
    const body = {
      key: this.apiKey,
      ne_lat: northEast.latitude,
      ne_lng: northEast.longitude,
      sw_lat: southWest.latitude,
      sw_lng: southWest.longitude
    }

    if(options.minPower) body["min_power"]=options.minPower;
    if(options.onlyFree){
      body["freecharging"]=true;
      body["freeparking"]=true;
    } 
    if(options.openNow) body["open_now"]=true;
    if(options.onlyShowMyTariffs && options.myTariffs.length > 0){
      body["chargecards"]=options.myTariffs
        .map(t=>t.chargeCardId)
        .filter((value, index, self) => self.indexOf(value) === index)
        .join(",");
    }
    if(options.myVehicle){
      body["plugs"]=this.mapPlugs(options.myVehicle.dcChargePorts);
    }

    return body;
  }

  encodeBody(body){
    return Object.keys(body).map((k) => [k, body[k]].join("=")).join("&")
  }

  async parseStationsResponse(response, vehicle) {
    const root = await response.json();
    return {
      stations: root.chargelocations.map(m => this.toLightModel(m, vehicle)),
      startKey: root.startkey
    }
  }

  async parseStationResponse(response, vehicle) {
    const root = await response.json();
    return root.chargelocations.map(m => this.toDetailModel(m, vehicle))[0]
  }

  toLightModel(data,vehicle) {
    return {
      dataAdapter: "going_electric",
      id: String(data.ge_id),
      longitude: data.coordinates.lng,
      latitude: data.coordinates.lat,
      country: data.address.country,
      network: this.valueOrFallback(data.network),
      chargePoints: data.chargepoints.map((cp,idx) => this.parseChargePoint(cp,idx,vehicle)),
      faultReported: data.fault_report
    }
  }

  toDetailModel(data,vehicle) {
    return {
      dataAdapter:       "going_electric",
      id:                String(data.ge_id),
      name:              data.name,
      network:           this.valueOrFallback(data.network),
      networkId:         this.valueOrFallback(data.network),
      address:           `${data.address.street}, ${data.address.postcode} ${data.address.city}`,
      longitude:         data.coordinates.lng,
      latitude:          data.coordinates.lat,
      isFreeCharging:    data.cost.freecharging,
      isFreeParking:     data.cost.freeparking,
      priceDescription:  this.valueOrFallback(data.cost.description_long),
      country:           data.address.country,
      chargeCardIds:     this.valueOrFallback(data.chargecards, []).map(cc => String(cc.id)),
      chargePoints:      data.chargepoints.map((cp,idx) => this.parseChargePoint(cp,idx,vehicle)),
      goingElectricUrl:  "https:" + data.url,
      faultReported:     !!data.fault_report,
      faultReport:       data.fault_report
    }
  }
  
  valueOrFallback(value, fallback=null){
    return value != false ? value : fallback
  }

  parseChargePoint(hash,idx,vehicle){
    const chargepoint = {
      id: String(idx), 
      power: hash.power,
      plug:  hash.type,
      count: hash.count
    }

    this.addChargePointSupportedFlag(chargepoint,vehicle);

    return chargepoint;
  }

  mapPlugs(vehiclePlugs){
    return vehiclePlugs.reduce(
      (memo,obj)=>memo.concat(this.plugMapping[obj]), 
      this.defaultPlugs)
    ;
  }

  addChargePointSupportedFlag(chargepoint,vehicle){
    if(!vehicle){
      chargepoint.supportedByVehicle=true;
      return;
    }

    const isDefaultPort = this.defaultPlugs.includes(chargepoint.plug);
    const isSupportedFastCharger = vehicle.dcChargePorts.some((type)=>this.plugMapping[type].includes(chargepoint.plug));

    chargepoint.supportedByVehicle = isDefaultPort || isSupportedFastCharger;
  }

}