import JsonApiDeserializer from '../helper/json_api_deserializer.js'
import { Forbidden } from '../errors.js'

export default class Company {
  constructor() {
    this.base_url = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;
  }

  // All CPO companies (hundreds), with meta.promoted and meta.branding.
  // The promotion info is only added if the country is set.
  async cpos(country=null){
    const query = country ? `?filter[user_country]=${encodeURIComponent(country)}` : "";
    const results = await this.request(`${this.base_url}/v1/companies/cpos${query}`);
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
