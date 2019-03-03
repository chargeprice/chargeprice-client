class Map {

  constructor() {
    this.component = L.map('map');
    this.markers = [];
    this.initializeLayer();
    $("#map").show();
  }

  initializeLayer() {
    L.tileLayer('https://maps.tilehosting.com/styles/streets/{z}/{x}/{y}@2x.png?key=fALH6jrAdefZHHX6nkxn', {
      maxZoom: 18,
      id: 'mapbox.streets'
    }).addTo(this.component);
  }

  centerLocation(coords, zoom = 13) {
    this.component.setView([coords.latitude, coords.longitude], zoom);
  }

  isBigArea(onlyHPC) {
    const maxValue = onlyHPC ? 9 : 11;
    return this.component.getZoom() < maxValue;
  }

  getBounds() {
    const bounds = this.component.getBounds();
    return {
      northEast: {
        latitude: bounds.getNorthEast().lat,
        longitude: bounds.getNorthEast().lng
      },
      southWest: {
        latitude: bounds.getSouthWest().lat,
        longitude: bounds.getSouthWest().lng
      }
    };
  }

  clearMarkers() {
    this.markers.forEach(m => m.remove());
    this.markers = [];
  }

  addStation(model, onClickCallback) {

    let color = '';

    const maxSpeed = model.connectors.reduce((max, value) => max > value.speed ? max : value.speed, 0);

    if (maxSpeed > 50) {
      color = "red";
    } else if (maxSpeed > 22) {
      color = "orange";
    } else if (maxSpeed > 3.7) {
      color = "blue";
    } else {
      color = "gray";
    }

    var redMarker = L.AwesomeMarkers.icon({
      icon: "plug",
      markerColor: color,
      prefix: 'fa'
    });

    const marker = L.marker([model.latitude, model.longitude], { icon: redMarker });
    marker.addTo(this.component);
    marker.on('click', () => onClickCallback(model));
    this.markers.push(marker);
  }

  onBoundsChanged(callback) {
    this.component.on("moveend", res => callback(this.getBounds()));
  }

}