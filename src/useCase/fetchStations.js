
import StationTariffs from '../repository/station_tariffs'
const haversine = require('haversine')

export default class FetchStations {

  constructor(depts){
    this.depts=depts;
    this.pricePreviewStationLimit = 100;

    this.stationTariffsRepo = new StationTariffs(this.depts);
  }

  async list(northEast, southWest,options){

    const stations = (await this.stationTariffsRepo.getStations(northEast, southWest,options)).stations;
    const mapCenter = this.mapCenter(northEast, southWest);
    const indexedPricePreviews = await this.fetchIndexedPricePreviewForStations(stations,options, mapCenter);

    return {
      stations: stations,
      indexedPricePreviews: indexedPricePreviews.prices || {},
      cheapestPrice: indexedPricePreviews.cheapestPrice,
    };
  }

  async fetchIndexedPricePreviewForStations(stations,options, mapCenter){
    if(!options.pricesOnMap || options.myVehicle == null || stations.length==0) return {};
    const closestStationsToCenter = this.closestStationsToCenter(stations, mapCenter);
    const pricePreviews = await this.stationTariffsRepo.getPricePreviewForStations(closestStationsToCenter,options);
    pricePreviews.forEach(pricePreview=>pricePreview.pricePerKWh = pricePreview.price / pricePreview.energy);
    const cheapestPrice = pricePreviews.reduce((memo,pricePreview)=>pricePreview.pricePerKWh < memo ? pricePreview.pricePerKWh : memo,Number.MAX_SAFE_INTEGER);
    const prices = pricePreviews.reduce((memo,pricePreview)=>{
      pricePreview.best = pricePreview.pricePerKWh <= cheapestPrice * 1.05;
      memo[pricePreview.chargingStation.id] = pricePreview;
      return memo;
    },{});

    return {
      prices: prices,
      cheapestPrice: cheapestPrice
    }
  }

  mapCenter(northEast, southWest){
    return  {latitude: (northEast.latitude + southWest.latitude)/2, longitude: (northEast.longitude + southWest.longitude)/2};
  }

  closestStationsToCenter(stations,center){
    return stations.slice().sort((a,b)=>haversine(center,a)-haversine(center,b)).slice(0,this.pricePreviewStationLimit);
  }

  async detail(model, options) {
    return model.lite ? (await this.stationTariffsRepo.getStationDetails(model.id, options)) : model;
  }
}