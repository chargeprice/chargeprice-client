class CalculatePrice {

  constructor(station, tariff, options) {
    this.station = station;
    this.tariff = tariff;
    this.options = options;
    this.options["customerOf"] = "";
  }

  run() {
    const consideredComponents = this.filterComponents(this.tariff.prices);

    if (consideredComponents.length == 0) return null;

    const price = this.aggregateComponents(consideredComponents);
    return price;
  }

  filterComponents(tariffPrices) {
    return tariffPrices.filter(tp => {
      return tp.restrictions.every(r => this.isRestrictionFulfilled(r));
    });
  }

  isRestrictionFulfilled(restriction) {
    const value = restriction.value;
    let pass = true;
    const connector = this.selectedConnector();
    switch (restriction.metric) {
      case "connector_energy":
        pass = value == connector.energy;break;
      case "connector_speed":
        pass = value.some(speed => connector.speed == speed);break;
      case "region":
        pass = value.some(region => this.station.region == region);break;
      case "provider_customer":
        pass = this.tariff.provider == this.options.customerOf;break;
      case "network":
        pass = value.some(network => this.station.network == network);break;
      case "car_ac_phases":
        pass = value == this.options.carACPhases;break;
    }

    switch (restriction.allowance) {
      case "allow":
        return pass;
      case "deny":
        return !pass;
    }
  }

  aggregateComponents(tariffPrices) {
    return tariffPrices.reduce((sum, tp) => sum + this.componentPrice(tp), 0);
  }

  componentPrice(tariffPrice) {
    return tariffPrice.decomposition.reduce((sum, seg) => sum + this.segmentPrice(seg), 0);
  }

  segmentPrice(segment) {
    switch (segment.degree) {
      case "linear":
        return this.linearSegmentPrice(segment);
      case "constant":
        return segment.price;
    }
  }

  linearSegmentPrice(segment) {
    const amount = this.amountForDimension(segment.dimension);

    const gte = segment.range_gte || 0;
    const lte = segment.range_lte || Number.MAX_SAFE_INTEGER;

    const amountInRange = amount <= gte ? 0 : Math.min(amount, lte) - gte;

    return amountInRange * segment.price;
  }

  amountForDimension(dimension) {
    switch (dimension) {
      case "kwh":
        return this.options.kwh;
      case "minute":
        return this.options.duration;
    }
  }

  selectedConnector() {
    return this.station.connectors.find(c => c.id == this.options.connectorId);
  }
}