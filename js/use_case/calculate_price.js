class CalculatePrice {

  constructor(station, tariff, options){
    this.station = station;
    this.tariff = tariff;
    this.options = options;
    this.options["customerOf"] = "";
  }

  run(){
    const consideredComponents = this.filterComponents(this.tariff.prices);

    if(consideredComponents.length==0) return null;

    const price = this.aggregateComponents(consideredComponents);
    return price;
  }

  filterComponents(tariffPrices){
    return tariffPrices.filter(tp=>{
      return tp.restrictions.every(r=>this.isRestrictionFulfilled(r));
    });
  }

  isRestrictionFulfilled(restriction){
    const value = restriction.allowed_value;
    const connector = this.selectedConnector();
    switch(restriction.metric){
      case "connector_energy":
        return value == connector.energy;
      case "connector_speed":
        return value.some(speed=>connector.speed==speed);
      case "region":
        return value.some(region=>this.station.region==region);
      case "provider_customer":
        return this.tariff.provider == this.options.customerOf;
    }
  }

  aggregateComponents(tariffPrices){
    return tariffPrices.reduce((sum,tp)=>sum + this.componentPrice(tp),0);
  }

  componentPrice(tariffPrice){
    return tariffPrice.decomposition.reduce((sum,seg)=>sum+this.segmentPrice(seg),0);
  }

  segmentPrice(segment){
    switch(segment.degree){
      case "linear":
        return this.linearSegmentPrice(segment);
      case "constant":
        return segment.price
    }
  }

  linearSegmentPrice(segment){
    const amount = this.amountForDimension(segment.dimension);

    const gte = segment.range_gte || 0;
    const lte = segment.range_lte || Number.MAX_SAFE_INTEGER;

    const amountInRange = amount <= gte ? amount : Math.min(amount, lte) - gte;
    
    return amountInRange*segment.price;
  }

  amountForDimension(dimension){
    switch(dimension){
      case "kwh":
        return this.options.kwh;
      case "minute":
        return this.options.duration;
    }
  }

  selectedConnector(){
    return this.station.connectors.find(c=>c.id == this.options.connectorId)
  }
}