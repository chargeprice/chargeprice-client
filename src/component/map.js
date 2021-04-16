var L = require('leaflet');
require('leaflet.awesome-markers');
require('leaflet.markercluster');

export default class Map {

  constructor(depts) {
    this.customConfig = depts.customConfig();
    this.component = L.map('map');
    this.markers = L.markerClusterGroup({ iconCreateFunction: this.buildClusterMarker});
    this.markers.addTo(this.component);
    this.selectedStationCircle = null;
    this.myLocation = null;
    this.searchLocation = null;
    this.mapReady = false;
    this.initializeLayer();
  }

  initializeLayer() {
    this.component.zoomControl.setPosition('topright');

    const scaleWidth = this.customConfig.isMobileOrTablet() ? 60 : 100;
    L.control.scale({maxWidth: scaleWidth}).addTo(this.component);

    if(this.customConfig.isBeta()) this.initVectorLayer();
    else this.initRasterLayer()
  }

  initRasterLayer(){
    L.tileLayer(`https://{s}-tiles.locationiq.com/v2/streets/r/{z}/{x}/{y}.png?key=${process.env.LOCATION_IQ_KEY}`, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.component);
  }

  initVectorLayer(){
    import(/* webpackChunkName: "mapbox" */ './mapbox.js').then(()=>{
      L.mapboxGL({
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
        accessToken: 'not-needed',
        style: `https://tiles.locationiq.com/v2/streets/vector.json?key=${process.env.LOCATION_IQ_KEY}`
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
    if(!this.myLocation) this.myLocation = this.buildMyLocationMarker(coords);
    else this.myLocation.setLatLng([coords.latitude, coords.longitude]);
  }

  setSearchLocation(coords){
    if(!this.searchLocation) this.searchLocation = this.buildLocationMarker(coords, "star");
    else this.searchLocation.setLatLng([coords.latitude, coords.longitude]);
  }

  buildMyLocationMarker(coords){
    const marker = L.marker([coords.latitude, coords.longitude],{icon: L.divIcon({className: 'my-location-icon'})});

    marker.addTo(this.component);
    marker.setZIndexOffset(10000);
    return marker;
  }

  buildClusterMarker(cluster){
    return L.divIcon({ html: '<div class="cp-map-cluster-marker">' + cluster.getChildCount() + '</div>' });
  }

  buildLocationMarker(coords, icon){
    const markerIcon = L.icon({
      iconUrl: `img/markers/search_single.png`,
      shadowUrl: '/img/leaflet/markers-shadow.png',

      iconSize:     [28, 40],
      iconAnchor:   [14, 40],
      shadowSize:   [40,24],
      shadowAnchor: [10,24]
    });

    const marker = L.marker([coords.latitude, coords.longitude],{icon: markerIcon});
    marker.setZIndexOffset(10001);
    marker.addTo(this.component);

    return marker;
  }

  isBigArea(minPower){
    let maxValue = 11;

    if(minPower >= 43) maxValue = 9;
    if(minPower > 50) maxValue = 7;
    if(minPower > 150) maxValue = 5;

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
    let zIndex = 0;

    const maxPower = model.chargePoints.filter(v=>v.supportedByVehicle).reduce((max,value)=> max > value.power ? max : value.power, 0);
    const fastChargerCount = model.chargePoints.reduce((sum,value)=> value.supportedByVehicle && value.power >= 50 ? sum + value.count : sum,0);

    if(maxPower > 50){
      color = fastChargerCount > 1 ? "ultra_multi" : "ultra_single";
      powerType = ">50"
      zIndex = 1000;
    }
    else if(maxPower > 22){
      color = fastChargerCount > 1 ? "fast_multi" : "fast_single";
      powerType = ">22"
      zIndex = 900;
    }
    else if(maxPower > 3.7){
      color = "ac_single";
      powerType = ">3.7"
      zIndex = 800;
    }
    else{
      color = "slow_single";
      powerType = "<=3.7"
      zIndex = 700;
    }

    const markerIcon = L.icon({
        iconUrl: `img/markers/${color}${model.faultReported ? "_fault" : ""}.png`,
        shadowUrl: '/img/leaflet/markers-shadow.png',
  
        iconSize:     [28, 40],
        iconAnchor:   [14, 40],
        shadowSize:   [40,24],
        shadowAnchor: [10,24]
    });
        
    const marker = L.marker([model.latitude, model.longitude],{icon: markerIcon});
    marker.on('click', () => onClickCallback(model,powerType));
    marker.on('click', () => this.changeSelectedStation(model));
    marker.setZIndexOffset(zIndex);

    // If shown before at this location, show it again
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

  rerender(){
    window.dispatchEvent(new Event('resize'));
  }

}