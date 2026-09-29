import JsonApiDeserializer from '../helper/json_api_deserializer.js'
const decodePolyline = require('decode-google-map-polyline');

// Poll a pending trip calculation for at most this long
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 60000;

export class TripError extends Error {
  // code: e.g. "NO_ROUTE_FOUND", "PREMIUM_REQUIRED" or null for unknown errors
  constructor(code){
    super(code || "TRIP_ERROR");
    this.code = code;
  }
}

// Trip (route) planning, see chargeprice-api-docs/api/v1/trips
export default class Trips {
  constructor(depts){
    this.baseUrl = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;
  }

  async create(attributes, relationships, accessToken){
    const body = { data: { type: "trip", attributes: attributes, relationships: relationships } };
    const response = await fetch(`${this.baseUrl}/v1/trips`, {
      method: "POST",
      headers: this.headers(accessToken),
      body: JSON.stringify(body)
    });

    let trip = await this.parse(response);
    const startedAt = Date.now();

    while(trip.status == "pending"){
      if(Date.now() - startedAt > MAX_POLL_MS) throw new TripError(null);
      await new Promise(resolve=>setTimeout(resolve, POLL_INTERVAL_MS));
      trip = await this.parse(await fetch(`${this.baseUrl}/v1/trips/${trip.id}`, { headers: this.headers(accessToken) }));
    }

    return trip;
  }

  async get(tripId, accessToken){
    return this.parse(await fetch(`${this.baseUrl}/v1/trips/${tripId}`, { headers: this.headers(accessToken) }));
  }

  // attributes: { charge_stop: { id, new_station_id }, is_saved }. Requires a logged in user.
  async update(tripId, attributes, accessToken){
    const response = await fetch(`${this.baseUrl}/v1/trips/${tripId}`, {
      method: "PATCH",
      headers: this.headers(accessToken),
      body: JSON.stringify({ data: { type: "trip_update", attributes: attributes } })
    });
    return this.parse(response);
  }

  // Saved trips of a user (newest first), only with a summary of the selected route
  async listSaved(userId, accessToken){
    const response = await fetch(`${this.baseUrl}/v1/users/${userId}/trips`, { headers: this.headers(accessToken) });
    if(response.status != 200) throw new TripError(null);

    const data = (await new JsonApiDeserializer(response).deserialize()).data;
    return (Array.isArray(data) ? data : [data]).filter(trip=>trip && trip.routes).map(trip=>{
      const route = trip.routes.find(r=>r.id == trip.selectedRouteId) || trip.routes[0];
      const stops = (route.steps || []).filter(step=>step.type == "stop");
      return {
        id: trip.id,
        start: stops.length > 0 ? stops[0].name : "",
        destination: stops.length > 1 ? stops[stops.length - 1].name : "",
        totalDistance: route.total_distance,
        totalDuration: route.total_duration,
        chargeStopCount: route.charge_stop_count
      };
    });
  }

  headers(accessToken){
    const headers = {
      "Content-Type": "application/json",
      "Api-Key": this.apiKey
    };
    if(accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return headers;
  }

  async parse(response){
    if(response.status != 200 && response.status != 201){
      let code = null;
      try { code = (await response.json()).errors[0].code; } catch(e) {}
      throw new TripError(code);
    }

    const trip = (await new JsonApiDeserializer(response).deserialize()).data;
    const routes = trip.routes || [];
    const route = routes.find(r=>r.id == trip.selectedRouteId) || routes[0];

    return {
      id: trip.id,
      // A missing status means the calculation is already complete
      status: trip.status || "completed",
      isSaved: !!trip.isSaved,
      route: route ? this.toRouteModel(route) : null
    };
  }

  toRouteModel(route){
    const stationsById = {};
    (route.stations_on_route || []).forEach(s=>{ stationsById[s.id || s.station_id] = s; });

    const chargeStops = route.steps.filter(s=>s.type == "charge_stop");
    const selectedIds = new Set(chargeStops.map(s=>s.station_id));
    const candidateIds = new Set();
    chargeStops.forEach(stop=>(stop.station_candidates || []).forEach(c=>{
      if(!selectedIds.has(c.station_id)) candidateIds.add(c.station_id);
    }));

    return {
      totalDistance: route.total_distance,
      totalDuration: route.total_duration,
      totalDrivingDuration: route.total_driving_duration,
      totalChargingDuration: route.total_charging_duration,
      totalChargingCost: route.total_charging_cost,
      currency: route.currency,
      chargeStopCount: route.charge_stop_count,
      segments: (route.geometry_segments || []).map(segment=>({
        category: segment.state_of_charge_category,
        points: decodePolyline(segment.polyline).map(p=>[p.lat, p.lng])
      })),
      steps: route.steps,
      // Pin data of the selected charging stations, falling back to the charge stop itself
      chargingStations: chargeStops.map(stop=>this.toStation(stationsById[stop.station_id] || stop, stop.station_id)),
      candidateStations: [...candidateIds].filter(id=>stationsById[id]).map(id=>this.toStation(stationsById[id], id))
    };
  }

  toStation(data, id){
    return {
      id: id,
      latitude: data.latitude,
      longitude: data.longitude,
      power: data.power,
      chargePointCount: data.charge_point_count,
      price: data.price != null ? data.price : null,
      currency: data.currency,
      promoted: !!data.promoted,
      mapPinIconUrl: data.map_pin_icon_url || null
    };
  }
}
