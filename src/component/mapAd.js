import { render } from 'lit-html';
import Advertisements from '../repository/advertisements';
import BannerAd from './bannerAd';

// Banner ad at the bottom of the map (placement "map"), only in the free version
export default class MapAd {
  constructor(depts, premiumGate){
    this.premiumGate = premiumGate;
    this.repo = new Advertisements(depts);
    this.bannerAd = new BannerAd(depts, premiumGate);
    this.country = null;
    this.currentAdId = null;
  }

  // The ad country is the country of the station closest to the map center
  async update(stations, center){
    if(!this.premiumGate.isRestricted()) return;

    const country = this.countryAt(stations, center);
    if(!country || country == this.country) return;
    this.country = country;

    const ad = await this.repo.bannerFor(country, "map");
    // The map was moved to another country while loading
    if(this.country != country) return;

    render(ad ? this.bannerAd.template(ad) : "", document.getElementById("mapAd"));

    if(ad && ad.id != this.currentAdId) this.repo.trackDisplay(ad);
    this.currentAdId = ad ? ad.id : null;
  }

  countryAt(stations, center){
    let closest = null;
    let closestDistance = Number.MAX_VALUE;

    stations.forEach(station=>{
      if(!station.country) return;
      const distance = Math.pow(station.latitude - center.latitude, 2) + Math.pow(station.longitude - center.longitude, 2);
      if(distance < closestDistance){
        closest = station;
        closestDistance = distance;
      }
    });

    return closest ? closest.country : null;
  }
}
