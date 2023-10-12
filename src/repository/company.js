
import JsonApiDeserializer from '../helper/json_api_deserializer.js'
import { Forbidden } from '../errors.js'

export default class Company {
  constructor() {
    this.base_url = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;
  }

  async search(query){
    const results = await this.request(`${this.base_url}/v1/companies?q=${query}&fields[company]=name`);
    return results.data;
  }

  async request(url){
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      }
    })
    
    if(response.status == 403) throw new Forbidden();
    if(response.status != 200) throw "Error in request";

    return await new JsonApiDeserializer(response).deserialize();
  }
}


