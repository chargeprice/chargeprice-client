class StationTariffs {

  constructor(){
    const useLocalData = false;
    const isRunningLocally = window.location.href.indexOf("127.0.0.1") != -1
    this.base_url = useLocalData && isRunningLocally ? "http://localhost:9292" : "https://api.plugchecker.com";
    this.apiKey = "1cd41427-728b-4c94-962b-8ec2547f0fd0";
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
    return this.flattenObjectOrArray(root.included,root.data);
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
        }
      } 
    });
  }



  dereference(included, relationship){
    const ref = relationship.data

    if(Array.isArray(ref)) return ref.map((i)=>this.dereferenceObject(included,i));
    else return this.dereferenceObject(included,ref)   
  }

  dereferenceObject(included, ref){
    const jsonApiObj = included.find((val)=>val.id == ref.id && val.type == ref.type);
    return this.flattenObject(included,jsonApiObj);
  }

  flattenObjectOrArray(included,objOrArray){
    if(Array.isArray(objOrArray)) return objOrArray.map((i)=>this.flattenObject(included,i));
    else return this.flattenObject(included,objOrArray);
  }

  flattenObject(included,obj){
    const attr = {};
    attr["id"] = obj.id;
    attr["type"]=obj.type;

    for(let key in obj.attributes){
      attr[this.snakeToCamel(key)] = obj.attributes[key];
    }

    for(let key in obj.relationships){
      attr[this.snakeToCamel(key)] = this.dereference(included,obj.relationships[key])
    }
    return attr;
  }

  snakeToCamel(s){
    return s.replace(/(\_\w)/g, function(m){return m[1].toUpperCase();});
  }

}