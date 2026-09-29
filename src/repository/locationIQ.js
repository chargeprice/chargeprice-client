
export default class LocationIQ{

  constructor(depts) {
    this.apiKey = process.env.LOCATION_IQ_KEY;
    this.translation = depts.translation();
  }

  async getAutocomplete(searchTerm){
    const url = `https://api.locationiq.com/v1/search.php?key=${this.apiKey}&q=${encodeURI(searchTerm)}&limit=5&format=json&addressdetails=1&accept-language=${this.translation.currentLocaleOrFallback()}`
    const response = await fetch(url);
    if(response.status != 200) throw response.status;

    const root = await response.json();
    return root.map(entry=>{

      const ad = entry.address;
      const city = ad.city || ad.town || ad.village || ad.municipality || ad.county;
      const street = ad.road || ad.residential || ad.neighbourhood || ad.hamlet || ad.suburb;

      const fullDisplayName = [
        ad.name != street ? ad.name : null, 
        [street, ad.house_number].filter(n=>n).join(" "), 
        [ad.postcode, city].filter(n=>n).join(" "), 
        ad.state != city ? ad.state : null, 
        ad.country
      ].filter(n=>n).join(", ");

      return {
        name: fullDisplayName,
        latitude: parseFloat(entry.lat),
        longitude: parseFloat(entry.lon)
      }
    });
  }

}