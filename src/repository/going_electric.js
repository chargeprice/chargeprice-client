export default class GoingElectric {

  constructor() {
    this.apiKey = "16faec520ed8c3f6a1c73ed4801a57d2";
    this.url = "https://api.goingelectric.de/chargepoints";
  }

  async getStations(northEast, southWest,options) {
    const body = {
      key: this.apiKey,
      ne_lat: northEast.latitude,
      ne_lng: northEast.longitude,
      sw_lat: southWest.latitude,
      sw_lng: southWest.longitude
    }

    if(options.onlyHPC) body["min_power"]=43;
    if(options.onlyFree){
      body["freecharging"]=true;
      body["freeparking"]=true;
    } 
    if(options.openNow) body["open_now"]=true;
    if(options.onlyShowMyTariffs && options.myTariffs.length > 0){
      body["barrierfree"]=true;
      body["chargecards"]=options.myTariffs
        .map(t=>t.chargeCardId)
        .filter((value, index, self) => self.indexOf(value) === index)
        .join(",");
    }

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: this.encodeBody(body),
    })

    return await this.parseStationsResponse(response);
  }

  async getStationDetails(stationId){
    const body = { key: this.apiKey, ge_id: stationId }

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: this.encodeBody(body),
    })

    return await this.parseStationResponse(response);
  }

  encodeBody(body){
    return Object.keys(body).map((k) => [k, body[k]].join("=")).join("&")
  }

  async parseStationsResponse(response) {
    const root = await response.json();
    return root.chargelocations.map(m => this.toLightModel(m))
  }

  async parseStationResponse(response) {
    const root = await response.json();
    return root.chargelocations.map(m => this.toDetailModel(m))[0]
  }

  toLightModel(data) {
    return {
      id: String(data.ge_id),
      longitude: data.coordinates.lng,
      latitude: data.coordinates.lat,
      chargePoints: data.chargepoints.map(cp=>{ return {power: cp.power }})
    }
  }

  toDetailModel(data) {
    return {
      id:                String(data.ge_id),
      name:              data.name,
      network:           this.valueOrFallback(data.network),
      longitude:         data.coordinates.lng,
      latitude:          data.coordinates.lat,
      isFreeCharging:    data.cost.freecharging,
      isFreeParking:     data.cost.freeparking,
      priceDescription:  this.valueOrFallback(data.cost.description_long),
      country:           data.address.country,
      chargeCardIds:     this.valueOrFallback(data.chargecards, []).map(cc => String(cc.id)),
      chargePoints:      data.chargepoints.map((cp,idx) => this.parseChargePoint(cp,idx)),
      goingElectricUrl:  "https:" + data.url
    }
  }

  valueOrFallback(value, fallback=null){
    return value != false ? value : fallback
  }

  parseChargePoint(hash,idx){
    return {
      id: String(idx), 
      power: hash.power,
      plug:  hash.type,
      count: hash.count
    }
  }
}