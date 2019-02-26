class StationTariffs {

  constructor() {
    this.base_url = "https://charge-compare.herokuapp.com";
    this.normalize = window.jsonApiNormalize;
  }

  async getTariffsOfStation(stationId) {
    const url = `${this.base_url}/v1/stations/${stationId}/station_tariffs`;
    const response = await fetch(url);
    const root = await response.json();
    return this.flattenObject(root.included, root.data);
  }

  async check() {
    const url = `${this.base_url}/check`;
    try {
      await fetch(url);
    } catch (ex) {}
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