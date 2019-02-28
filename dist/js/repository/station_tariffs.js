class StationTariffs {

  constructor() {
    this.base_url = "https://pre-charge-compare.herokuapp.com";
    //this.base_url = "http://localhost:9292";
    this.normalize = window.jsonApiNormalize;
  }

  async getTariffsOfStation(station) {

    const url = `${this.base_url}/v1/tariffs`;
    const body = this.buildJsonApiRequestBody(station);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: body
    });

    const root = await response.json();
    return this.flattenObject(root.included, root.data);
  }

  async check() {
    const url = `${this.base_url}/check`;
    try {
      await fetch(url);
    } catch (ex) {}
  }

  buildJsonApiRequestBody(station) {
    return JSON.stringify({
      data: {
        type: "tariff_options",
        attributes: {
          latitude: station.latitude,
          longitude: station.longitude,
          network: station.network,
          region: station.region,
          charge_card_ids: station.chargeCardIds,
          connectors: station.connectors
        }
      }
    });
  }

  dereference(included, relationship) {
    const ref = relationship.data;

    if (Array.isArray(ref)) return ref.map(i => this.dereferenceObject(included, i));else return this.dereferenceObject(included, ref);
  }

  dereferenceObject(included, ref) {
    const jsonApiObj = included.find(val => val.id == ref.id && val.type == ref.type);
    return this.flattenObject(included, jsonApiObj);
  }

  flattenObject(included, obj) {
    const attr = {};
    attr["id"] = obj.id;
    attr["type"] = obj.type;

    for (let key in obj.attributes) {
      attr[this.snakeToCamel(key)] = obj.attributes[key];
    }

    for (let key in obj.relationships) {
      attr[this.snakeToCamel(key)] = this.dereference(included, obj.relationships[key]);
    }
    return attr;
  }

  snakeToCamel(s) {
    return s.replace(/(\_\w)/g, function (m) {
      return m[1].toUpperCase();
    });
  }

}