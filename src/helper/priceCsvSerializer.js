export default class PriceCsvSerializer {

  constructor(priceList, station, options){
    this.priceList = priceList;
    this.station = station;
    this.options = options;
    this.headers = [
      "Charging Duration (Minutes)",
      "Charged Energy (kWh)",
      "Station Latitude",
      "Station Longitude",
      "Station Operator Name",
      "Tariff Name",
      "Tariff Provider Name",
      "Tariff ID",
      "Monthly Fee",
      "Currency",
      "Total Price",
      "kWh-based Price Share",
      "Time-based Price Share",
      "Session Fee",
      "Blocking Fee Start (Minutes)",
    ]
  }
  
  serialize(){
    const pricesToCsv = this.priceList.map(price=>this.serializeRow(price)).filter(row=>row!=null);
    const fullCsv = [this.headers].concat(pricesToCsv);
    return fullCsv.map(row=>row.join(",")).join("\n");
  }

  serializeRow(price){
    if(price.price == null) return null;
    return [
      this.options.chargePointDuration,
      this.options.chargePointEnergy,
      this.station.latitude,
      this.station.longitude,
      this.station.network,
      price.tariff.tariffName,
      price.tariff.provider,
      price.tariff.id,
      price.tariff.totalMonthlyFee,
      price.tariff.currency,
      price.price.toFixed(2),
      ((price.distribution["kwh"] || 0) * price.price).toFixed(2),
      ((price.distribution["minute"] || 0) * price.price).toFixed(2),
      ((price.distribution["session"] || 0) * price.price).toFixed(2),
      price.blockingFeeStart
    ]
  }
}