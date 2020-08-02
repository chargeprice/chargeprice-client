

export default class LocationIQ{

  constructor() {
    this.apiKey = process.env.LOCATION_IQ_KEY;
    this.host = "https://api.locationiq.com";
  }

  async getAutocomplete(searchTerm){
    const url = `${this.host}/v1/autocomplete.php?key=${this.apiKey}&q=${encodeURI(searchTerm)}&limit=5`
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
}