import JsonApiDeserializer from '../helper/json_api_deserializer.js'

// Banner ads per country, loaded once per session
const bannersByCountry = {};

export default class Advertisements {
  constructor(depts){
    this.translation = depts.translation();
    this.baseUrl = process.env.CHARGEPRICE_API_URL;
    this.apiKey = process.env.CHARGEPRICE_API_KEY;
  }

  // First banner for the given placement ("map", "price_list1", ...) or null
  async bannerFor(country, placement){
    if(!country) return null;
    const banners = await this.banners(country);
    return banners.find(b=>b.placement == placement) || null;
  }

  banners(country){
    if(!bannersByCountry[country]) bannersByCountry[country] = this.fetchBanners(country);
    return bannersByCountry[country];
  }

  async fetchBanners(country){
    try {
      const url = `${this.baseUrl}/v1/advertisements?filter[country]=${country}&filter[type]=banner_advertisement`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": this.translation.currentLocaleOrFallback(),
          "Api-Key": this.apiKey
        }
      });

      if(response.status != 200) throw `Advertisements not available (${response.status})`;

      return (await new JsonApiDeserializer(response).deserialize()).data
        .filter(ad=>ad.type == "banner_advertisement" && ad.bannerImageUrl)
        .map(ad=>({
          id: ad.id,
          country: country,
          placement: ad.placementLocation,
          imageUrl: ad.bannerImageUrl,
          ctaUrl: ad.ctaUrl,
          deeplinkTarget: ad.deeplinkTarget,
          impressionUrl: ad.impressionTrackingUrl
        }));
    }
    catch(error){
      // Ads are optional, the app works the same without them
      console.warn(error);
      return [];
    }
  }

  trackImpression(ad){
    if(!ad.impressionUrl) return;
    fetch(ad.impressionUrl, { mode: "no-cors", keepalive: true }).catch(()=>{});
  }
}
