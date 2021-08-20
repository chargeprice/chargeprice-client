const decodePolyline = require('decode-google-map-polyline');

export default class LocationIQ{

  constructor(depts) {
    this.apiKey = process.env.LOCATION_IQ_KEY;
    this.translation = depts.translation();
  }

  async getAutocomplete(searchTerm){
    const url = `https://api.locationiq.com/v1/autocomplete.php?key=${this.apiKey}&q=${encodeURI(searchTerm)}&limit=5&accept-language=${this.translation.currentLocaleOrFallback()}`
    const response = await fetch(url);
    if(response.status != 200) throw response.status;

    const root = await response.json();
    return root.map(entry=>{
      return {
        name: entry.display_name,
        latitude: entry.lat,
        longitude: entry.lon
      }
    });
  }

  async getDirections(waypoints){
    const encodedWaypoints = waypoints.map(wp=>`${wp.longitude},${wp.latitude}`).join(";");

    const url = `https://eu1.locationiq.com/v1/directions/driving/${encodedWaypoints}?key=${this.apiKey}&overview=full`
    const response = await fetch(url);
    if(response.status != 200) throw response.status;

    const root = await response.json();

    if(root.routes.length==0) return null;

    const route = root.routes[0];

    return {
      distance: route.distance,
      duration: route.duration,
      points: decodePolyline(route.geometry).map(res=>{ return { latitude: res.lat, longitude: res.lng } })
    }  
  }
}