require('jsrender')($);
var L = require('leaflet');
require('leaflet.awesome-markers');

export default class Map {

  constructor() {
    this.component = L.map('map');
    this.markers = L.layerGroup([]);
    this.markers.addTo(this.component);
    this.selectedStationCircle = null;
    this.myLocation = null;
    this.searchLocation = null;
    this.mapReady = false;
    this.initializeLayer();
    $("#map").show();
  }

  initializeLayer() {
    this.component.zoomControl.setPosition('topright');

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
    this.component._onResize(); 
  }

  centerMyLocation(){
    if(this.myLocation==null) return;
    const ll = this.myLocation._latlng;
    this.centerLocation({latitude: ll.lat, longitude: ll.lng});
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
    this.clearSelectedStationCircle();
  }

  clearSelectedStationCircle(){
    if(this.selectedStationCircle){
      this.component.removeLayer(this.selectedStationCircle);
    }
  }

  addStation(model, onClickCallback) {

    let color = '';
    let powerType = null;

    const maxPower = model.chargePoints.reduce((max,value)=> max > value.power ? max : value.power, 0);

    if(maxPower > 50){
      color = "darkred"
      powerType = ">50"
    }
    else if(maxPower > 22){
      color = "orange"
      powerType = ">22"
    }
    else if(maxPower > 3.7){
      color = "blue"
      powerType = ">3.7"
    }
    else{
      color = "gray";
      powerType = "<=3.7"
    }

    const markerIcon = L.AwesomeMarkers.icon({
      icon: "plug",
      markerColor: color,
      prefix: 'fa'
    });
        
    const marker = L.marker([model.latitude, model.longitude],{icon: markerIcon});
    marker.on('click', () => onClickCallback(model,powerType));
    marker.on('click', () => this.changeSelectedStation(model));

    // If shows before at this location, show it again
    // If not shown, station highlighted before is not shown anymore
    if(this.selectedStationCircle && this.selectedStationCircle.options.id == model.id){
      this.selectedStationCircle.addTo(this.component);
    }

    this.markers.addLayer(marker);
  }

  changeSelectedStation(model){
    this.clearSelectedStationCircle();

    this.selectedStationCircle = L.circleMarker([model.latitude, model.longitude],{
      id: model.id, 
      radius: 15, 
      color: "red", 
      weight: 3, 
      fillColor: "red", 
      fillOpacity: 0.2
    });
    this.selectedStationCircle.addTo(this.component);
  }

  onBoundsChanged(callback) {
    this.component.on("moveend", (res) => callback(this.getBounds()));
  }

}