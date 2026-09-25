var L = require('leaflet');
require('leaflet.awesome-markers');
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
    this.translation = depts.translation();
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

    // The API returns at most this many stations (the ones closest to the map center)
    this.stationLimit = 400;
    // Above this many stations, only stations with a price are shown as big pins
    this.denseStationThreshold = 250;
    this.stationLimitMask = null;
    this.stationLimitInfo = this.buildStationLimitInfo();
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

  effectiveZoom(){
    // Mobile screens cover a smaller geographic area at a given zoom level than
    // desktop screens, so they get fewer stations to begin with - ease the
    // zoom-based restrictions earlier to compensate.
    const mobileZoomBonus = 2;
    return this.component.getZoom() + (this.customConfig.isMobileOrTablet() ? mobileZoomBonus : 0);
  }

  minPowerOfStations(minPower){
    const currentZoom = this.effectiveZoom();
    let minPowerFromZoom = 0;

    if(currentZoom<=9) minPowerFromZoom = 150;
    else if(currentZoom<=11) minPowerFromZoom = 50;

    return minPower > minPowerFromZoom ? minPower : minPowerFromZoom;
  }

  showStationsAsDots(){
    return this.effectiveZoom() <= 11;
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
    this.clearStationLimit();
  }

  clearSelectedStationCircle(){
    if(this.selectedStationCircle){
      this.component.removeLayer(this.selectedStationCircle);
    }
  }

  resetMarkers(){
    this.component.removeLayer(this.markers);
    this.markers = L.layerGroup([]);
    this.markers.addTo(this.component);
  }

  showStations(stations, indexedPricePreviews, cheapestPrice, onClickCallback) {
    const allAsDots = this.showStationsAsDots();
    const dense = stations.length > this.denseStationThreshold;

    stations.forEach(model => {
      const pricePreview = indexedPricePreviews[model.id];
      const showAsDot = allAsDots || (dense && !pricePreview);
      this.addStation(model, pricePreview, cheapestPrice, showAsDot, onClickCallback);
    });

    this.updateStationLimit(stations);
  }

  addStation(model, pricePreview, cheapestPrice, showAsDot, onClickCallback) {
    const pinConfig = showAsDot ?
      this.pinClass.buildDotHtml(model) :
      this.pinClass.buildHtml(model, cheapestPrice, pricePreview);
    const icon = L.divIcon({
      className: showAsDot ? "cp-map-dot-marker" : "cp-map-poi-marker",
      html: pinConfig.html,
      iconSize:     [pinConfig.width, pinConfig.height],
      iconAnchor:   showAsDot ? [pinConfig.width/2, pinConfig.height/2] : [pinConfig.width/2, pinConfig.height],
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

  // If the station limit is reached, only the stations closest to the map center are returned.
  // Grey out everything beyond the furthest returned station and ask the user to zoom in.
  updateStationLimit(stations){
    this.clearStationLimit();

    const limitReached = stations.length > 0 && stations.length >= this.stationLimit;
    if(!limitReached) return;

    this.stationLimitInfo.style.display = "block";
    this.stationLimitInfo.innerText = this.translation.get("mapZoomInForMoreStations");

    const center = this.component.getBounds().getCenter();
    const radius = stations.reduce((memo, st) =>
      Math.max(memo, center.distanceTo([st.latitude, st.longitude])), 0);

    // Stack several masks with growing holes to get a soft edge towards the grey area
    const world = [[-90, -360], [-90, 360], [90, 360], [90, -360]];
    const bands = 8;
    const edgeWidth = radius * 0.15;
    const totalOpacity = 0.35;
    const bandOpacity = 1 - Math.pow(1 - totalOpacity, 1 / bands);

    this.stationLimitMask = L.layerGroup([...Array(bands).keys()].map(i =>
      L.polygon([world, this.circlePoints(center, radius + edgeWidth * i / bands)], {
        interactive: false,
        stroke: false,
        fillColor: "#666",
        fillOpacity: bandOpacity
      })
    ));
    this.stationLimitMask.addTo(this.component);
  }

  clearStationLimit(){
    this.stationLimitInfo.style.display = "none";
    if(this.stationLimitMask){
      this.component.removeLayer(this.stationLimitMask);
      this.stationLimitMask = null;
    }
  }

  circlePoints(center, radiusInMeters, segments = 90){
    const toRad = Math.PI / 180;
    const lat1 = center.lat * toRad;
    const lng1 = center.lng * toRad;
    const angularDistance = radiusInMeters / 6371008.8;
    const points = [];

    for(let i = 0; i < segments; i++){
      const bearing = (i / segments) * 2 * Math.PI;
      const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing));
      const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2));
      points.push([lat2 / toRad, lng2 / toRad]);
    }
    return points;
  }

  buildStationLimitInfo(){
    const info = L.DomUtil.create("div", "cp-map-station-limit-info", this.component.getContainer());
    info.style.display = "none";
    L.DomEvent.disableClickPropagation(info);
    return info;
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
