import JsonApiDeserializer from '../helper/json_api_deserializer.js'
import { v4 as uuidv4 } from 'uuid';
const decodePolyline = require('decode-google-map-polyline');

export default class Trips{
  constructor(depts) {
    this.depts = depts;
    this.baseUrl = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;
  }

  async create(stops, vehicleId, tariffIds){
    const body = {
      data: {
        id:            uuidv4(),
        type:          "trip",
        attributes:    {
            stops: stops
        },
        relationships: {
          vehicle: {
            data: { id: vehicleId, type: "vehicle" }
          },
          tariffs: {
            data: tariffIds.map(id => ({ id, type: "tariff" }))
          }
        }
      }
    }
    
    const url = `${this.baseUrl}/v1/trips`;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "Api-Key": this.apiKey
      }
    })
    
    if(response.status != 201) throw "Error in request";

    const result = (await new JsonApiDeserializer(response).deserialize()).data;

    result.routes.forEach(route => {
        route.geometry_segments.forEach(segment => {
            segment.decodedPolyline = decodePolyline(segment.polyline).map(res => { return { latitude: res.lat, longitude: res.lng } })
        })
    })

    return result;
  }
}