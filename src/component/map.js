var L = require('leaflet');
require('leaflet.awesome-markers');
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

// Route color by the battery level on this part of the trip
const TRIP_SEGMENT_COLORS = {
  normal: "#007AFF",
  warning: "#ff8229",
  low: "#f74a56",
  critical: "#b00020",
  empty: "#555555"
};

// Alternative charging stations of a trip are only shown from this zoom level on
const TRIP_CANDIDATES_MIN_ZOOM = 12;

export default class Map {

  constructor(depts) {
    this.customConfig = depts.customConfig();
    this.eventBus = depts.eventBus();
    this.component = L.map('map');
    this.markers = L.layerGroup([]);
    this.routing = L.layerGroup([]);
    this.routing.addTo(this.component);
    // Alternative charging stations of a trip, only shown when zoomed in
    this.tripCandidates = L.layerGroup([]);
    this.markers.addTo(this.component);
    this.selectedStationCircle = null;
    this.myLocation = null;
    this.searchLocation = null;
    this.mapReady = false;
    this.initializeLayer();

    this.iconWidth = 24;
    this.iconHeight = 30;
    this.priceIconWidth = 32;
    this.priceIconHeight = 24;
    this.pinClass = new MapPinsV5();

    // Above this many stations, only stations with a (not most expensive) price are shown as big pins
    this.denseStationThreshold = 100;

    // Promoted stations get golden pins and dots, except for premium users
    this.highlightPromoted = true;
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

  setHighlightPromoted(highlight){
    this.highlightPromoted = highlight;
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

    stations.forEach(station => {
      // Without highlighting, promoted stations are drawn like any other station
      const model = this.highlightPromoted || !station.branding ? station : Object.assign({}, station, { branding: null });
      const pricePreview = indexedPricePreviews[model.id];
      const showAsDot = allAsDots || (dense && !this.pinClass.isPriceHighlighted(model, pricePreview, cheapestPrice));
      // The click always gets the original station, only the pin ignores the promotion
      this.addStation(model, pricePreview, cheapestPrice, showAsDot, ()=>onClickCallback(station));
    });
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

  // Shows a planned trip (see repository/trips.js): route line, stops, charging stops and their alternatives
  showTrip(route, onStationClick){
    this.deleteTrip();

    // White outline first, so the route is visible on every map background
    route.segments.forEach(segment=>L.polyline(segment.points, { color: "#fff", weight: 9, opacity: 0.9 }).addTo(this.routing));
    route.segments.forEach(segment=>L.polyline(segment.points, { color: TRIP_SEGMENT_COLORS[segment.category] || TRIP_SEGMENT_COLORS.normal, weight: 5 }).addTo(this.routing));

    route.steps.filter(step=>step.type == "stop").forEach(step=>this.addTripStopMarker(step));

    const allStations = route.chargingStations.concat(route.candidateStations);
    const prices = allStations.map(s=>s.price).filter(p=>p != null);
    const cheapestPrice = prices.length > 0 ? Math.min(...prices) : null;

    // Charging stops are always shown as full pins
    route.chargingStations.forEach(station=>this.addTripStation(station, cheapestPrice, this.routing, 1, onStationClick, 900));
    route.candidateStations.forEach(station=>this.addTripStation(station, cheapestPrice, this.tripCandidates, 0.8, onStationClick, 0));

    this.tripZoomListener = ()=>this.updateTripCandidatesVisibility();
    this.component.on("zoomend", this.tripZoomListener);
    this.updateTripCandidatesVisibility();

    const bounds = L.latLngBounds(route.segments.reduce((memo, segment)=>memo.concat(segment.points), []));
    if(bounds.isValid()) this.component.fitBounds(bounds, { padding: [30, 30] });
  }

  addTripStopMarker(step){
    const icons = { start: "fa-circle", intermediate: "fa-map-marker", destination: "fa-flag-checkered" };
    const icon = L.divIcon({
      className: "trip-stop-marker",
      html: `<div class="trip-stop-marker-inner trip-stop-${step.stop_type}"><i class="fa ${icons[step.stop_type] || icons.intermediate}"></i></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([step.latitude, step.longitude], { icon: icon, zIndexOffset: 2000, title: step.name }).addTo(this.routing);
  }

  addTripStation(station, cheapestPrice, layer, opacity, onStationClick, zIndexBonus){
    // Same pin style as the regular stations
    const model = {
      chargePoints: [{ power: station.power || 0, count: station.chargePointCount || 1, supportedByVehicle: true }],
      branding: station.promoted && this.highlightPromoted ? { map_pin_icon_url: station.mapPinIconUrl } : null
    };
    const pricePreview = station.price != null ? { pricePerKWh: station.price, currency: station.currency } : null;
    const pinConfig = this.pinClass.buildHtml(model, cheapestPrice, pricePreview);

    const icon = L.divIcon({
      className: "cp-map-poi-marker",
      html: pinConfig.html,
      iconSize: [pinConfig.width, pinConfig.height],
      iconAnchor: [pinConfig.width/2, pinConfig.height]
    });

    const marker = L.marker([station.latitude, station.longitude], { icon: icon, opacity: opacity, zIndexOffset: pinConfig.zIndex + zIndexBonus });
    marker.on('click', ()=>{
      this.changeSelectedStation({ id: station.id, latitude: station.latitude, longitude: station.longitude });
      onStationClick(station);
    });
    marker.addTo(layer);
  }

  updateTripCandidatesVisibility(){
    const visible = this.effectiveZoom() >= TRIP_CANDIDATES_MIN_ZOOM;
    const shown = this.component.hasLayer(this.tripCandidates);
    if(visible && !shown) this.tripCandidates.addTo(this.component);
    else if(!visible && shown) this.component.removeLayer(this.tripCandidates);
  }

  deleteTrip(){
    this.routing.clearLayers();
    this.tripCandidates.clearLayers();
    this.component.removeLayer(this.tripCandidates);
    if(this.tripZoomListener) this.component.off("zoomend", this.tripZoomListener);
    this.tripZoomListener = null;
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
