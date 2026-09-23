
import StationTariffs from '../repository/station_tariffs'
import GoingElectric from '../repository/going_electric'
const haversine = require('haversine')

export default class FetchStations {

  constructor(depts){
    this.depts=depts;
    this.deduplicateThreshold = 50;
    this.deduplicateThresholdFast = 120;
    this.pricePreviewStationLimit = 100;

    this.stationTariffsRepo = new StationTariffs(this.depts);
  }

  async list(northEast, southWest,options){

    let goingElectric = new GoingElectric().getStations(northEast, southWest,options);
    let internalStations = this.stationTariffsRepo.getStations(northEast, southWest,options);

    const [goingElectricResult, internalResult] = await Promise.all([goingElectric, internalStations]);

    const deduplicatedStations = this.deduplicate(goingElectricResult, internalResult);
    const mapCenter = this.mapCenter(northEast, southWest);
    const indexedPricePreviews = await this.fetchIndexedPricePreviewForStations(deduplicatedStations,options, mapCenter);

    return {
      stations: deduplicatedStations,
      indexedPricePreviews: indexedPricePreviews.prices || {},
      cheapestPrice: indexedPricePreviews.cheapestPrice,
    };
  }

  deduplicate(goingElectricResult, internalResult){
    const disabledGoingElectricCountries = internalResult.meta.disabled_going_electric_countries;
    const internalStations = internalResult.stations;

    const enabledGoingElectricStations = goingElectricResult.filter(geStation=>
      !this.hideGoingElectricStation(geStation, internalStations, disabledGoingElectricCountries)
    );

    return internalStations.concat(enabledGoingElectricStations);
  }

  async fetchIndexedPricePreviewForStations(stations,options, mapCenter){
    if(options.myVehicle == null || stations.length==0) return {};
    const closestStationsToCenter = this.closestChargepriceStationsToCenter(stations, mapCenter);
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

  closestChargepriceStationsToCenter(stations,center){
    const chargepriceStations = stations.filter(st=>st.dataAdapter=="chargeprice");
    return chargepriceStations.sort((a,b)=>haversine(center,a)-haversine(center,b)).slice(0,this.pricePreviewStationLimit);
  }

  hideGoingElectricStation(geStation, internalStations, disabledGoingElectricCountries){
    return disabledGoingElectricCountries.includes(geStation.country) || 
      this.isStationCloseToInternalStation(geStation, internalStations);
  }

  isStationCloseToInternalStation(geStation, internalStations){
    const maxPowerGeStation = this.getMaximumPower(geStation);
    return internalStations.some(station=>
      haversine(geStation,station,{unit: 'meter'}) < this.nearbyThreshold(maxPowerGeStation)
    );
  }

  nearbyThreshold(maxPower){
    return maxPower >= 50 ? this.deduplicateThresholdFast : this.deduplicateThreshold;
  }

  getMaximumPower(station){
    return station.chargePoints.reduce((max,value)=> max > value.power ? max : value.power, 0);
  }

  async detail(model, options) {
    switch(model.dataAdapter){
      case "going_electric":
        return await (new GoingElectric()).getStationDetails(model.id, options);
      case "chargeprice":
        return model.lite ? (await (new StationTariffs(this.depts)).getStationDetails(model.id, options)) : model ;
    }
  }
}