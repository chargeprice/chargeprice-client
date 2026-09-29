import JsonApiDeserializer from '../helper/json_api_deserializer.js'
import { NotFound } from '../errors.js'

export default class Vehicle{
  constructor(depts) {
    this.depts = depts;
    this.baseUrl = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;
    this.pageSize = 100;

    this.brandsCache = null;
    this.vehiclesByBrandCache = {};
  }

  async search(query){
    const result = await this.get(`${this.baseUrl}/v2/vehicles?q=${query}`);
    return result.data.map(v=>this.buildModelFromV2(v));
  }

  async find(id){
    const result = await this.get(`${this.baseUrl}/v2/vehicles?filter[id]=${id}`);
    const vehicles = result.data.map(v=>this.buildModelFromV2(v));

    if(vehicles.length > 0) return vehicles[0];
    else throw new NotFound();
  }

  async brands(){
    if(this.brandsCache) return this.brandsCache;

    const result = await this.get(`${this.baseUrl}/v2/vehicle_brands`);
    this.brandsCache = result.data
      .map(b=>({ id: b.id, name: b.name }))
      .sort((a,b)=>a.name.localeCompare(b.name));

    return this.brandsCache;
  }

  async byBrand(brandId){
    if(this.vehiclesByBrandCache[brandId]) return this.vehiclesByBrandCache[brandId];

    let vehicles = [];
    let page = 1;
    let overallCount = 0;
    let pageLength = 0;

    do {
      const result = await this.get(`${this.baseUrl}/v2/vehicles?filter[manufacturer.id]=${brandId}&page[size]=${this.pageSize}&page[number]=${page}`);
      pageLength = result.data.length;
      vehicles = vehicles.concat(result.data.map(v=>this.buildModelFromV2(v)));
      overallCount = result.meta ? result.meta.overall_count : vehicles.length;
      page++;
    } while(pageLength > 0 && vehicles.length < overallCount);

    this.vehiclesByBrandCache[brandId] = vehicles;
    return vehicles;
  }

  async get(url){
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      }
    })

    if(response.status != 200) throw "Error in request";

    return await new JsonApiDeserializer(response).deserialize();
  }

  buildModelFromV2(vehicle){
    const year = vehicle.releaseYear ? `(${vehicle.releaseYear})` : null

    return {
      id: vehicle.id,
      type: vehicle.type,
      name: [vehicle.model, vehicle.variant,year].filter(v=>v).join(" "),
      brand: vehicle.manufacturer.name,
      brandId: vehicle.manufacturer.id,
      model: vehicle.model,
      variant: vehicle.variant,
      releaseYear: vehicle.releaseYear,
      dcChargePorts: vehicle.dcPorts,
      usableBatterySize: vehicle.usableBatterySize,
      acMaxPower: vehicle.acMaxPower,
      dcMaxPower: vehicle.dcMaxPower,
      // Average consumption in kWh/100km
      consumption: (vehicle.energyConsumption || {}).average_consumption || null
    }
  }

}
