import JsonApiDeserializer from '../helper/json_api_deserializer.js'

export default class Tariff{
  constructor(depts) {
    this.depts = depts;
    this.baseUrl = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;
  }

  async where(ids=null){
    if(ids && ids.length==0) return [];

    const url = `${this.baseUrl}/v1/tariffs${ids ? `&filter[id]=${ids.join(",")}` : ""}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      }
    })
    
    if(response.status != 200) throw "Error in request";

    return (await new JsonApiDeserializer(response).deserialize()).data;
  }
}