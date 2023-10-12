import JsonApiDeserializer from '../helper/json_api_deserializer.js'
import JsonApiSerializer from '../helper/jsonApiSerializer.js'
import { Forbidden, NotFound } from '../errors.js'
import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile';

export default class UserSettings{
  constructor(depts) {
    this.depts = depts;
    this.base_url = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;

    this.cache = null;
  }

  async show(){
    if(this.cache) return this.cache;

    const response =  await this.request("get");
    this.cache = response;
    return response;
  }

  async upsert(model){

    const jsonHash = new JsonApiSerializer(model,["tariffs","vehicle"]).serialize();
    const jsonString = JSON.stringify(jsonHash);

    const response = await this.request("put",jsonString);
    this.cache = response;
    
    return response;
  }

  clearCache(){
    this.cache = null;
  }

  async request(method, body){
    const tokenWithProfile = await new FetchAccessTokenWithProfile(this.depts).run();

    const url = `${this.base_url}/v1/users/${tokenWithProfile.profile.userId}/settings`;
    const response = await fetch(url, {
      method: method,
      body: body,
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey,
        "Authorization": `Bearer ${tokenWithProfile.accessToken}`
      }
    })
    
    await this.handleErrors(response);

    return (await new JsonApiDeserializer(response).deserialize());
  }

  async handleErrors(response){
    if(response.status == 403){
      const code = (await this.response.json()).errors[0].code;
      if(code == "TOKEN_EXPIRED"){
        throw new AccessTokenExpired();
      }
      else {
        throw new Forbidden();
      }
    } 
    if(response.status == 409){
      const code = (await this.response.json()).errors[0].code;
      if(code == "VERSION_CONFLICT"){
        throw new VersionConflict();
      }
      else {
        throw new IdConflict();
      }
    } 
    if(response.status == 404) throw new NotFound();
    if(response.status == 409) throw new VersionConflict();
    if(response.status > 299) throw "Error in request";
  }
}