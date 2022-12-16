import JsonApiDeserializer from '../helper/json_api_deserializer.js'
import { NotFound } from '../errors.js'

export default class Vehicle{
  constructor(depts) {
    this.depts = depts;
    this.baseUrl = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;

    this.cache = null;
  }

  async findAll(){
    const url = `${this.baseUrl}/v1/vehicles`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      }
    })
    
    if(response.status != 200) throw "Error in request";

    return (await new JsonApiDeserializer(response).deserialize())
      .data.map(v=>this.buildModelFromV1(v));
  }

  async find(id){
    const url = `${this.baseUrl}/v2/vehicles?filter[id]=${id}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      }
    })
    
    if(response.status != 200) throw "Error in request";

    const vehicles = (await new JsonApiDeserializer(response).deserialize())
      .data.map(v=>this.buildModelFromV2(v));

    if(vehicles.length > 0) return vehicles[0];
    else throw new NotFound();
  }

  buildModelFromV1(vehicle){
    return {
      id: vehicle.id,
      type: vehicle.type,
      name: vehicle.name,
      brand: vehicle.brand,
      dcChargePorts: vehicle.dcChargePorts,
      usableBatterySize: vehicle.usableBatterySize,
      acMaxPower: vehicle.acMaxPower,
      dcMaxPower: vehicle.dcMaxPower
    }
  }

  buildModelFromV2(vehicle){
    const year = vehicle.releaseYear ? `(${vehicle.releaseYear})` : null

    return {
      id: vehicle.id,
      type: vehicle.type,
      name: [vehicle.model, vehicle.variant,year].filter(v=>v).join(" "),
      brand: vehicle.manufacturer.name,
      dcChargePorts: vehicle.dcPorts,
      usableBatterySize: vehicle.usableBatterySize,
      acMaxPower: vehicle.acMaxPower,
      dcMaxPower: vehicle.dcMaxPower
    }
  }

}