
import StationTariffs from '../repository/station_tariffs'
import GoingElectric from '../repository/going_electric'
const haversine = require('haversine')

export default class FetchStations {

  constructor(){
    this.deduplicateThreshold = 50;
  }

  async list(northEast, southWest,options){

    let goingElectric = new GoingElectric().getStations(northEast, southWest,options);
    let internalStations = new StationTariffs().getStations(northEast, southWest,options);

    const [goingElectricResult, internalResult] = await Promise.all([goingElectric, internalStations]);

    return this.deduplicate(goingElectricResult, internalResult);
  }

  deduplicate(goingElectricResult, internalResult){
    const disabledGoingElectricCountries = internalResult.meta.disabled_going_electric_countries;
    const internalStations = internalResult.stations;

    const enabledGoingElectricStations = goingElectricResult.filter(geStation=>
      !this.hideGoingElectricStation(geStation, internalStations, disabledGoingElectricCountries)
    );

    return internalStations.concat(enabledGoingElectricStations);
  }

  hideGoingElectricStation(geStation, internalStations, disabledGoingElectricCountries){
    return disabledGoingElectricCountries.includes(geStation.country) || 
      this.isStationCloseToInternalStation(geStation, internalStations);
  }

  isStationCloseToInternalStation(geStation, internalStations){
    return internalStations.some(station=>haversine(geStation,station,{unit: 'meter'}) < this.deduplicateThreshold);
  }

  async detail(model, options) {
    switch(model.dataAdapter){
      case "going_electric":
        return await (new GoingElectric()).getStationDetails(model.id, options);
      case "chargeprice":
        return model;
    }
  }
}