class GoingElectric {

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

    const encodedBody = Object.keys(body).map((k) => [k, body[k]].join("=")).join("&")

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: encodedBody,
    })

    return await this.parseResponse(response);
  }

  async parseResponse(response) {
    const root = await response.json();
    return root.chargelocations.map(m => this.toModel(m))
  }

  toModel(data) {
    return {
      id: data.ge_id,
      longitude: data.coordinates.lng,
      latitude: data.coordinates.lat,
      connectors: data.chargepoints.map(cp=>{ return {speed: cp.power }})
    }
  }

}