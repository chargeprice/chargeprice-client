require('jsrender')($);
var L = require('leaflet');
require('leaflet.awesome-markers');

export default class Map {

  constructor() {
    this.component = L.map('map');
    this.markers = L.layerGroup([]);
    this.markers.addTo(this.component);
    this.myLocation = null;
    this.searchLocation = null;
    this.mapReady = false;
    this.initializeLayer();
    $("#map").show();
  }

  initializeLayer() {
    import(/* webpackChunkName: "mapbox" */ './mapbox.js').then(()=>{
      L.mapboxGL({
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
        accessToken: 'not-needed',
        style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.MAPTILER_API_KEY}`
      }).addTo(this.component);
    });
  }

  centerLocation(coords, zoom=13) {
    this.mapReady = true;
    this.component.setView([coords.latitude, coords.longitude], zoom);
  }

  watchLocation(){
    navigator.geolocation.watchPosition((res)=>this.setMyLocation(res.coords));
  }

  setMyLocation(coords){
    if(!this.myLocation) this.myLocation = this.buildLocationMarker(coords, "circle");
    else this.myLocation.setLatLng([coords.latitude, coords.longitude]);
  }

  setSearchLocation(coords){
    if(!this.searchLocation) this.searchLocation = this.buildLocationMarker(coords, "star");
    else this.searchLocation.setLatLng([coords.latitude, coords.longitude]);
  }

  buildLocationMarker(coords, icon){
    const markerIcon = L.AwesomeMarkers.icon({
      icon: icon,
      markerColor: "red",
      prefix: 'fa'
    });

    const marker = L.marker([coords.latitude, coords.longitude],{icon: markerIcon});
    marker.addTo(this.component);

    return marker;
  }

  isBigArea(onlyHPC){
    const maxValue = onlyHPC ? 9 : 11 
    return this.component.getZoom() < maxValue;
  }

  getBounds() {
    if (!this.mapReady) return;
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
    }
  }

  clearMarkers() {
    this.markers.clearLayers();
  }

  addStation(model, onClickCallback) {

    let color = '';

    const maxPower = model.chargePoints.reduce((max,value)=> max > value.power ? max : value.power, 0);

    if(maxPower > 50){
      color = "darkred"
    }
    else if(maxPower > 22){
      color = "orange"
    }
    else if(maxPower > 3.7){
      color = "blue"
    }
    else{
      color = "gray";
    }

    const markerIcon = L.AwesomeMarkers.icon({
      icon: "plug",
      markerColor: color,
      prefix: 'fa'
    });
        
    const marker = L.marker([model.latitude, model.longitude],{icon: markerIcon});
    marker.on('click', () => onClickCallback(model));
    this.markers.addLayer(marker);
  }

  onBoundsChanged(callback) {
    this.component.on("moveend", (res) => callback(this.getBounds()));
  }

}