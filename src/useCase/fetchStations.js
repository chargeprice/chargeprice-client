
import StationTariffs from '../repository/station_tariffs'
import GoingElectric from '../repository/going_electric'
const haversine = require('haversine')

export default class FetchStations {

  constructor(depts){
    this.depts=depts;
    this.deduplicateThreshold = 50;
    this.deduplicateThresholdFast = 120;
  }

  async list(northEast, southWest,options){

    let goingElectric = new GoingElectric().getStations(northEast, southWest,options);
    let internalStations = new StationTariffs(this.depts).getStations(northEast, southWest,options);

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
    const maxPowerGeStation = this.getMaximumPower(geStation);
    return internalStations.some(station=>
      haversine(geStation,station,{unit: 'meter'}) < this.nearbyThreshold(maxPowerGeStation) && 
        maxPowerGeStation <= this.getMaximumPower(station)
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