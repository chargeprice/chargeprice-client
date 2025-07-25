var L = require('leaflet');
require('leaflet.awesome-markers');
require('leaflet.markercluster');
var turf = {
  along: require('@turf/along').default,
  length: require('@turf/length').default,
  helpers: require('@turf/helpers')
}
import MapPinsV5 from './mapPins/v5.js';

export const defaultLocations = {
	PARIS: {
		longitude: 2.3120158,
		latitude: 48.858906
	},
	SALZBURG: {
		longitude: 13.037706424201586,
		latitude: 47.80292337050403
	},
  COPENHAGEN: {
    longitude: 12.568359375,
    latitude: 55.676098
  }
}

export default class Map {

  constructor(depts) {
    this.customConfig = depts.customConfig();
    this.eventBus = depts.eventBus();
    this.component = L.map('map');
    this.markers = L.layerGroup([]);
    this.routing = L.layerGroup([]);
    this.routing.addTo(this.component);
    this.markers.addTo(this.component);
    this.selectedStationCircle = null;
    this.myLocation = null;
    this.searchLocation = null;
    this.mapReady = false;
    this.initializeLayer();
    this.registerEvents();

    this.iconWidth = 24;
    this.iconHeight = 30;
    this.priceIconWidth = 32;
    this.priceIconHeight = 24;
    this.pinClass = new MapPinsV5();
  }

  initializeLayer() {
    this.component.zoomControl.setPosition('topright');

    const scaleWidth = this.customConfig.isMobileOrTablet() ? 60 : 100;
    L.control.scale({maxWidth: scaleWidth}).addTo(this.component);

    this.initRasterLayer();
  }

  initRasterLayer(){
    L.tileLayer(`https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${process.env.LOCATION_IQ_KEY}`, {
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

  registerEvents(){
    this.eventBus.subscribe("route.created",(payload)=>this.showRoute(payload));
    this.eventBus.subscribe("route.deleted",(payload)=>this.deleteRoute(payload));
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
      iconUrl: `img/markers/search.svg`,
      iconSize:     [this.iconWidth, this.iconHeight],
      iconAnchor:   [this.iconWidth/2, this.iconHeight],
    });

    const marker = L.marker([coords.latitude, coords.longitude],{icon: markerIcon});
    marker.setZIndexOffset(10001);
    marker.addTo(this.component);

    return marker;
  }

  minPowerOfStations(minPower){
    const currentZoom = this.component.getZoom();
    let minPowerFromZoom = 0;

    if(currentZoom<=6) minPowerFromZoom = 300;
    else if(currentZoom<=7) minPowerFromZoom = 150;
    else if(currentZoom<=8) minPowerFromZoom = 100;
    else if(currentZoom<=10) minPowerFromZoom = 43;

    return minPower > minPowerFromZoom ? minPower : minPowerFromZoom;
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

  toggleClustering(stationCount){
    this.component.removeLayer(this.markers);
    if(stationCount >=250){
      this.markers = L.markerClusterGroup({ iconCreateFunction: this.buildClusterMarker});
    }
    else {
      this.markers = L.layerGroup([]);
    }

    this.markers.addTo(this.component);
  }

  addStation(model, indexedPricePreviews, cheapestPrice, onClickCallback) {
    const pricePreview = indexedPricePreviews[model.id];
    const pinConfig = this.pinClass.buildHtml(model, cheapestPrice, pricePreview);
    const icon = L.divIcon({
      className: "cp-map-poi-marker",
      html: pinConfig.html,
      iconSize:     [pinConfig.width, pinConfig.height],
      iconAnchor:   [pinConfig.width/2, pinConfig.height],
  });
    const marker = L.marker([model.latitude, model.longitude],{icon: icon})
    marker.on('click', () => onClickCallback(model));
    marker.on('click', () => this.changeSelectedStation(model));
    marker.setZIndexOffset(pinConfig.zIndex);

    // If shown before at this location, show it again
    // If not shown, station highlighted before is not shown anymore
    if(this.selectedStationCircle && this.selectedStationCircle.options.id == model.id){
      this.selectedStationCircle.addTo(this.component);
    }

    this.markers.addLayer(marker);
  }

  showRoute(routingResult){
    this.deleteRoute();

    const points = routingResult.route.points.map(ll=>[ll.latitude,ll.longitude]);

    const routeLine = L.polyline(points, { color: "#007AFF", weight: 5, distanceMarkers: true });
    routeLine.addTo(this.routing);

    const invertedPoints = points.map(coord=>coord.reverse());
    const turfLine = turf.helpers.lineString(invertedPoints);
    const turfOptions = {units: 'kilometers'};
    const totalDistance = turf.length(turfLine,turfOptions);

    const delta= 50;
    let currentDistance = delta;

    while(currentDistance < totalDistance){
      var along = turf.along(turfLine, currentDistance, turfOptions);
      const coord = along.geometry.coordinates.reverse();
      L.marker(coord, { icon: this.distanceMarkerIcon(currentDistance) }).addTo(this.routing);
      currentDistance += delta;
    }

    this.component.fitBounds(routeLine.getBounds());
    this.component._onResize();
  }

  distanceMarkerIcon(km){
    return new L.DivIcon({
      className: 'distance-icon',
      html: `<span class="w3-black w3-border">${km} km</span>`
    });
  }

  deleteRoute(){
    this.routing.clearLayers();
  }

  changeSelectedStation(model){
    this.clearSelectedStationCircle();

    this.selectedStationCircle = L.circleMarker([model.latitude, model.longitude],{
      id: model.id,
      radius: 10,
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

  registerClickOnce(callback){
    const listener = (evt)=>{
        callback({location: {longitude: evt.latlng.lng, latitude: evt.latlng.lat}});
        this.component.off('click', listener);
      };
    this.component.on('click', listener);
  }

  rerender(){
    window.dispatchEvent(new Event('resize'));
  }

}
