import { html, render } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';

import ViewBase from '../component/viewBase';
import '../component/locationSearchBox';
import Trips from '../repository/trips';
import FetchValidAccessToken from '../useCase/fetchValidAccessToken';
import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile';
import Authorization from '../component/authorization';
import GenericList from '../modal/genericList';
import AppUpsellBanner from '../component/appUpsellBanner';
import { TRIP_SEGMENT_CATEGORIES, TRIP_SEGMENT_COLORS } from '../helper/tripColors';

// Google Maps route links support at most 9 waypoints between origin and destination
const GOOGLE_MAPS_MAX_WAYPOINTS = 9;

// Consumption slider: offset in percent to the vehicle's standard consumption
const CONSUMPTION_OFFSET_MIN = -50;
const CONSUMPTION_OFFSET_MAX = 100;

export default class RoutePlanner extends ViewBase{
  constructor(sidebar,depts) {
    super(depts);
    this.sidebar = sidebar;
    this.depts = depts;
    this.eventBus = depts.eventBus();
    this.analytics = depts.analytics();
    this.settingsPrimitive = depts.settingsPrimitive();
    this.trips = new Trips(depts);
    this.appUpsellBanner = new AppUpsellBanner(depts, sidebar.premiumGate);

    this.waypointCounter = 0;
    this.waypoints = [this.newWaypoint("routePlannerStart"), this.newWaypoint("routePlannerDestination")];
    this.options = {
      strategy: "fastest",
      consumptionOffset: 0,
      socStart: 80,
      socDestination: 20,
      avoidMotorway: false,
      avoidToll: false
    };

    this.currentLocation = null;
    this.tripId = null;
    this.isSaved = false;
    this.saving = false;
    this.savedTrips = [];
    this.savedTripsLoaded = false;
    this.route = null;
    // Charge stop whose alternatives are shown
    this.editingChargeStopId = null;
    this.showResult = false;
    this.loading = false;
    this.error = null;
  }

  newWaypoint(placeholderKey){
    return { key: ++this.waypointCounter, placeholder: this.t(placeholderKey), place: null };
  }

  template(){
    return this.showResult && this.route ? this.resultTemplate() : this.formTemplate();
  }

  // ---------- Form ----------

  formTemplate(){
    return html`
      ${repeat(this.waypoints, wp=>wp.key, (wp,idx)=>html`
        <location-search-box
          placeholder="${wp.placeholder}"
          .placeName="${wp.place ? wp.place.name : ""}"
          ?removable="${this.waypoints.length > 2}"
          .currentLocation="${this.currentLocation}"
          @place-changed="${(res)=>this.onPlaceChanged(res.detail, idx)}"
          @removed="${()=>this.onRemoveStop(idx)}">
        </location-search-box>
      `)}

      <button @click="${()=>this.onAddStop()}" class="w3-btn w3-light-grey w3-small w3-round route-add-stop">
        <i class="fa fa-plus"></i> ${this.t("routePlannerAddStop")}
      </button>

      ${this.optionsTemplate()}

      ${this.error ? html`<p class="w3-text-red w3-small">${this.error}</p>` : ""}

      <button @click="${()=>this.onCalculate()}" ?disabled="${this.loading}" class="w3-btn pc-secondary w3-block w3-round route-calculate">
        ${this.loading ? html`<i class="fa fa-spinner fa-spin"></i> ${this.t("routeCalculating")}` : this.t("routePlannerCalculate")}
      </button>

      ${this.sidebar.premiumGate.isRestricted() ? html`
        <div class="route-premium-hint">
          ${this.appUpsellBanner.template({ title: this.t("routeAppBannerTitle"), text: this.t("routeDirectPaymentOnly"), source: "route_planner_tariffs" })}
        </div>
      ` : ""}

      ${this.route ? html`
        <button @click="${()=>this.onShowResult()}" class="w3-btn w3-light-grey w3-block w3-round w3-margin-top w3-small">
          ${this.t("routeShowResult")}
        </button>
      ` : ""}

      ${this.savedTripsTemplate()}
    `;
  }

  // Saved trips of the user (premium only)
  savedTripsTemplate(){
    if(this.sidebar.premiumGate.isRestricted() || this.savedTrips.length == 0) return "";

    return html`
      <div class="route-saved-trips">
        <label class="route-option-label">${this.t("routeSavedTrips")}</label>
        ${this.savedTrips.map(trip=>html`
          <div class="route-card route-saved-trip cp-clickable" @click="${()=>this.onOpenSavedTrip(trip)}">
            <div class="route-saved-trip-text">
              <div class="route-saved-trip-name">${trip.start} → ${trip.destination}</div>
              <div class="w3-small w3-text-dark-gray">
                ${this.formatDistance(trip.totalDistance)} · ${this.h().time(trip.totalDuration)} · ${this.chargeStopsText(trip.chargeStopCount)}
              </div>
            </div>
            <i class="fa fa-trash route-saved-trip-delete" title="${this.t("routeDeleteTrip")}" @click="${(e)=>{e.stopPropagation(); this.onDeleteSavedTrip(trip);}}"></i>
          </div>
        `)}
      </div>
    `;
  }

  optionsTemplate(){
    const consumption = this.consumption();

    return html`
      <div class="route-options">
        <label class="route-option-label">${this.t("routeStrategy")}</label>
        <div class="route-strategy">
          ${["fastest","cheapest"].map(strategy=>html`
            <span @click="${()=>this.onOptionChanged("strategy", strategy)}" class="w3-tag w3-round cp-clickable ${this.options.strategy == strategy ? "pc-secondary" : "w3-white w3-border"}">
              <i class="fa fa-${strategy == "fastest" ? "bolt" : "euro"}"></i> ${this.t(strategy == "fastest" ? "routeStrategyFastest" : "routeStrategyCheapest")}
            </span>
          `)}
        </div>

        ${consumption != null ? html`
          <label class="route-option-label">
            ${this.t("routeConsumption")}: <b>${consumption.toFixed(1)} kWh/100 km</b>
          </label>
          <input type="range" class="route-range" min="${CONSUMPTION_OFFSET_MIN}" max="${CONSUMPTION_OFFSET_MAX}" step="5"
            .value="${String(this.options.consumptionOffset)}"
            @input="${(e)=>this.onOptionChanged("consumptionOffset", parseInt(e.target.value))}">
        ` : ""}

        <label class="route-option-label">${this.t("routeSocStart")}: <b>${this.options.socStart}%</b></label>
        <input type="range" class="route-range" min="10" max="100" step="5"
          .value="${String(this.options.socStart)}"
          @input="${(e)=>this.onOptionChanged("socStart", parseInt(e.target.value))}">

        <label class="route-option-label">${this.t("routeSocDestination")}: <b>${this.options.socDestination}%</b></label>
        <input type="range" class="route-range" min="0" max="80" step="5"
          .value="${String(this.options.socDestination)}"
          @input="${(e)=>this.onOptionChanged("socDestination", parseInt(e.target.value))}">

        <label class="route-checkbox">
          <input type="checkbox" class="w3-check" .checked="${this.options.avoidMotorway}" @change="${(e)=>this.onOptionChanged("avoidMotorway", e.target.checked)}">
          ${this.t("routeAvoidMotorway")}
        </label>
        <label class="route-checkbox">
          <input type="checkbox" class="w3-check" .checked="${this.options.avoidToll}" @change="${(e)=>this.onOptionChanged("avoidToll", e.target.checked)}">
          ${this.t("routeAvoidToll")}
        </label>
      </div>
    `;
  }

  // Vehicle consumption including the slider offset, null if the vehicle has no consumption data
  consumption(){
    const vehicle = this.sidebar.myVehicle && this.sidebar.myVehicle.getVehicle();
    if(!vehicle || !vehicle.consumption) return null;
    return vehicle.consumption * (1 + this.options.consumptionOffset / 100);
  }

  // ---------- Result ----------

  resultTemplate(){
    const route = this.route;
    return html`
      ${this.actionsTemplate(route)}

      <div class="route-card route-summary">
        <div class="route-summary-top">
          <span class="route-summary-duration">${this.h().time(route.totalDuration)}</span>
          ${route.totalChargingCost != null && route.chargeStopCount > 0 ? html`
            <span class="route-cost-pill route-cost-pill-large"><i class="fa fa-credit-card"></i> ${this.formatCost(route.totalChargingCost, route.currency)}</span>
          ` : ""}
        </div>
        <div class="route-summary-line">
          <i class="fa fa-bolt"></i>
          ${this.chargeStopsSummary(route)}
        </div>
        <div class="route-summary-line">
          <i class="fa fa-road"></i>
          ${this.h().time(route.totalDrivingDuration)} - ${this.formatDistance(route.totalDistance)}
        </div>
      </div>

      ${this.stepsTemplate(route.steps)}

      ${this.routeLegendTemplate(route)}
    `;
  }

  // Explains the colors of the route on the map, only for the battery levels on this route
  routeLegendTemplate(route){
    const categories = TRIP_SEGMENT_CATEGORIES.filter(category=>route.segments.some(segment=>segment.category == category));
    if(categories.length == 0) return "";

    return html`
      <div class="route-legend">
        ${categories.map(category=>html`
          <span class="route-legend-item">
            <span class="route-legend-line" style="background: ${TRIP_SEGMENT_COLORS[category]}"></span>
            ${this.t(`routeBattery_${category}`)}
          </span>
        `)}
      </div>
    `;
  }

  actionsTemplate(route){
    const restricted = this.sidebar.premiumGate.isRestricted();

    return html`
      <div class="route-actions">
        <button @click="${()=>this.onEdit()}" class="route-action">
          <i class="fa fa-pencil"></i>
          <span>${this.t("routeEdit")}</span>
        </button>
        <button @click="${()=>this.onToggleSaved()}" ?disabled="${this.saving}" class="route-action ${this.isSaved ? "route-action-saved" : ""}">
          ${this.saving ? html`<i class="fa fa-spinner fa-spin"></i>` : html`<i class="fa fa-${this.isSaved ? "heart" : "heart-o"}"></i>`}
          <span>${this.t(this.isSaved ? "routeSaved" : "routeSave")}</span>
          ${restricted ? html`<i class="fa fa-star route-action-premium"></i>` : ""}
        </button>
        <a href="${this.googleMapsUrl(route)}" target="_blank" rel="noopener" class="route-action" @click="${()=>this.analytics.log('event', 'route_planner_google_maps')}">
          <i class="fa fa-route"></i>
          <span>${this.t("routeNavigate")}</span>
        </a>
        <button @click="${()=>this.onClearRoute()}" class="route-action">
          <i class="fa fa-undo"></i>
          <span>${this.t("routeReset")}</span>
        </button>
      </div>
    `;
  }

  chargeStopsText(count){
    if(count == 0) return this.t("routeNoChargeStops");
    if(count == 1) return this.t("routeOneChargeStop");
    return this.sf(this.t("routeChargeStops"), count);
  }

  // Whole route incl. intermediate and charging stops, see developers.google.com/maps/documentation/urls
  googleMapsUrl(route){
    const points = route.steps.filter(step=>step.type == "stop" || step.type == "charge_stop");
    const coords = point=>`${point.latitude},${point.longitude}`;
    const params = new URLSearchParams({
      api: "1",
      origin: coords(points[0]),
      destination: coords(points[points.length - 1]),
      travelmode: "driving"
    });
    const waypoints = points.slice(1, -1).slice(0, GOOGLE_MAPS_MAX_WAYPOINTS);
    if(waypoints.length > 0) params.set("waypoints", waypoints.map(coords).join("|"));
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  chargeStopsSummary(route){
    if(route.chargeStopCount == 0) return this.t("routeNoChargeStops");
    const key = route.chargeStopCount == 1 ? "routeChargeStopsSummaryOne" : "routeChargeStopsSummary";
    return this.sf(this.t(key), route.chargeStopCount, this.h().time(route.totalChargingDuration));
  }

  stepsTemplate(steps){
    return steps.map(step=>{
      switch(step.type){
        case "route_leg":
          return html`<div class="route-leg">${this.h().time(step.duration)} - ${this.formatDistance(step.distance)}</div>`;
        case "stop":
          return this.stopTemplate(step);
        case "charge_stop":
          return html`
            ${this.chargeStopTemplate(step)}
            ${this.editingChargeStopId == step.id ? this.alternativesTemplate(step) : ""}
          `;
        default:
          return "";
      }
    });
  }

  stopTemplate(step){
    const labels = { start: "routeStopStart", intermediate: "routeStopIntermediate", destination: "routeStopDestination" };
    return html`
      <div class="route-card route-stop">
        <i class="fa fa-car route-stop-icon"></i>
        <div>
          ${step.state_of_charge != null ? `${Math.round(step.state_of_charge * 100)}% · ` : ""}${this.t(labels[step.stop_type] || "routeStopIntermediate")}: ${step.name}
        </div>
      </div>
    `;
  }

  chargeStopTemplate(step){
    return html`
      <div class="route-card route-charge-stop cp-clickable" @click="${()=>this.onChargeStopClicked(step)}">
        <div class="route-charge-stop-header">
          <div class="route-charge-stop-name"><i class="fa fa-bolt"></i> ${step.station_name}</div>
          <i class="fa fa-pencil route-charge-stop-edit ${this.editingChargeStopId == step.id ? "route-charge-stop-edit-active" : ""}"
            title="${this.t("routeAlternativesHeader")}"
            @click="${(e)=>{e.stopPropagation(); this.onToggleAlternatives(step);}}"></i>
        </div>
        <div class="route-charge-stop-meta">
          ${[step.power ? `${this.h().power(step.power)} kW` : null, step.charge_point_count ? `${step.charge_point_count}x` : null, step.operator_name].filter(v=>v).join(" · ")}
        </div>
        <div class="route-summary-line">
          <i class="fa fa-car"></i>
          ${Math.round(step.state_of_charge_start * 100)}-${Math.round(step.state_of_charge_end * 100)}% · ${this.h().time(step.duration)}
        </div>
        ${step.cost != null ? html`
          <div class="route-cost-pill">
            <i class="fa fa-credit-card"></i> ${this.formatCost(step.cost, step.currency)}${step.tariff_name ? ` (${step.tariff_name})` : ""}
          </div>
        ` : ""}
      </div>
    `;
  }

  // Candidates of the charge stop incl. the selected station, the best (highest score) first. The score itself isn't shown.
  alternativesTemplate(step){
    const candidates = (step.station_candidates || []).slice().sort((a,b)=>b.score - a.score);
    const current = candidates.find(candidate=>candidate.station_id == step.station_id);
    const currentStation = this.route.stationsById[step.station_id];
    const restricted = this.sidebar.premiumGate.isRestricted();

    return html`
      <div class="route-alternatives">
        <div class="route-alternatives-header">${this.t("routeAlternativesHeader")}</div>
        ${candidates.length == 0 ? html`<div class="w3-small w3-text-dark-gray">${this.t("routeNoAlternatives")}</div>` : ""}
        ${candidates.map(candidate=>{
          const station = this.route.stationsById[candidate.station_id];
          const isCurrent = candidate == current;

          return html`
            <div class="route-alternative ${isCurrent ? "route-alternative-current" : ""}">
              <span class="route-alternative-check">
                ${isCurrent ? html`<i class="fa fa-check-circle" title="${this.t("routeCurrentChargeStop")}"></i>` : ""}
              </span>
              <span class="route-alternative-power">${station && station.power ? `${this.h().power(station.power)} kW` : ""}</span>
              <span class="route-alternative-diffs">
                ${isCurrent ? "" : this.alternativeDiffsTemplate(candidate, station, current, currentStation)}
              </span>
              ${station ? html`
                <button @click="${()=>this.onShowAlternativeOnMap(station)}" class="w3-button w3-round route-alternative-map" title="${this.t("routeShowOnMap")}">
                  <i class="fa fa-map-marker"></i>
                </button>
              ` : ""}
              ${!isCurrent ? html`
                <button @click="${()=>this.replaceChargeStop(step, { id: candidate.station_id })}" ?disabled="${this.saving}" class="w3-btn pc-secondary w3-round route-alternative-select" title="${this.t("routeUseAsChargingStop")}">
                  ${this.saving ? html`<i class="fa fa-spinner fa-spin"></i>` : ""}${this.t("routeSelectAlternative")}${restricted ? html` <i class="fa fa-star premium-star-inline"></i>` : ""}
                </button>
              ` : ""}
            </div>
          `;
        })}
      </div>
    `;
  }

  // Price (average per kWh, as requested for the trip) and detour compared to the currently selected station
  alternativeDiffsTemplate(candidate, station, current, currentStation){
    const diffs = [];

    if(station && currentStation && station.price != null && currentStation.price != null){
      const priceDiff = Math.round((station.price - currentStation.price) * 100) / 100;
      if(priceDiff != 0) diffs.push({ better: priceDiff < 0, text: `${priceDiff > 0 ? "+" : "−"}${this.h().dec(Math.abs(priceDiff))}/kWh` });
    }

    if(current){
      const detourDiff = Math.round((candidate.detour || 0) - (current.detour || 0));
      if(detourDiff != 0) diffs.push({ better: detourDiff < 0, text: `${detourDiff > 0 ? "+" : "−"}${Math.abs(detourDiff)} min` });
    }

    return diffs.map(diff=>html`<span class="${diff.better ? "route-diff-better" : "route-diff-worse"}">${diff.text}</span>`);
  }

  formatCost(cost, currency){
    return `${this.h().dec(cost)} ${currency || ""}`;
  }

  formatDistance(meters){
    return `${Math.round(meters / 1000)} km`;
  }

  // ---------- Actions ----------

  render(){
    render(this.template(),this.getEl("routeContent"));
  }

  onStationSelected(callback){
    this.stationSelectedCallback = callback;
  }

  onPlaceChanged(place,idx){
    this.analytics.log('event', 'location_search_click', {
      button: "route_planner",
      location_name: place.name,
      longitude: place.longitude,
      latitude: place.latitude
    });

    this.waypoints[idx].place = place;
    this.error = null;
    this.render();
  }

  onRemoveStop(idx){
    // At least start and destination are needed
    if(this.waypoints.length <= 2) return;
    this.waypoints.splice(idx, 1);
    this.render();
  }

  // The user's location is the default start, as long as no other start was chosen
  setCurrentLocation(coords){
    this.currentLocation = { name: this.t("routeMyLocation"), latitude: coords.latitude, longitude: coords.longitude, isCurrentLocation: true };

    const start = this.waypoints[0];
    if(!start.place || start.place.isCurrentLocation) start.place = this.currentLocation;
    this.render();
  }

  onAddStop(){
    // New stops go before the destination
    this.waypoints.splice(this.waypoints.length - 1, 0, this.newWaypoint("routePlannerStop"));
    this.render();
  }

  onOptionChanged(key, value){
    this.options[key] = value;
    this.render();
  }

  async onCalculate(){
    if(this.waypoints.some(wp=>wp.place == null)){
      this.error = this.t("routeMissingStops");
      this.render();
      return;
    }

    this.loading = true;
    this.error = null;
    this.render();

    try {
      const trip = await this.trips.create(this.buildAttributes(), this.buildRelationships(), await this.accessToken());
      if(!trip.route) throw { code: "NO_ROUTE_FOUND" };

      this.showTrip(trip);
      this.analytics.log('event', 'route_planner_calculate', {
        number_of_steps: this.waypoints.length - 2,
        strategy: this.options.strategy,
        charge_stops: this.route.chargeStopCount
      });
    }
    catch(error){
      console.error(error);
      const code = error && error.code;
      if(code == "PREMIUM_REQUIRED"){
        this.error = this.t("routePremiumRequired");
        this.sidebar.premiumGate.showPremiumScreen("route_planner");
      }
      else if(code == "NO_ROUTE_FOUND") this.error = this.t("routeNoRouteFound");
      else this.error = this.t("routeError");
    }

    this.loading = false;
    this.render();
  }

  buildAttributes(){
    const options = this.sidebar.chargingOptions();
    const exclude = [];
    if(this.options.avoidMotorway) exclude.push("motorway");
    if(this.options.avoidToll) exclude.push("toll");

    const attributes = {
      stops: this.waypoints.map(wp=>({ longitude: wp.place.longitude, latitude: wp.place.latitude, name: wp.place.name })),
      currency: options.displayedCurrency,
      route_strategy: this.options.strategy,
      state_of_charge_start: this.options.socStart / 100,
      state_of_charge_destination: this.options.socDestination / 100,
      exclude: exclude,
      price_display_mode: "average_price_per_kwh",
      include_direct_payment: true,
      // The trips API only knows mobile_premium (e.g. web_pro must not be sent)
      user_products: (((this.sidebar.userSettings.meta || {}).products) || []).filter(product=>product == "mobile_premium")
    };

    const consumption = this.consumption();
    if(consumption != null) attributes.vehicle_consumption = Math.round(consumption * 10) / 10;

    // Same filters as the map
    const filter = {};
    const minPower = parseFloat(options.minPower);
    if(minPower > 0) filter.charge_points_power_gte = minPower;
    if(options.facilities && options.facilities.length > 0) filter.facilities = options.facilities;
    if(options.cpoFilterChargeprice && options.cpoFilterChargeprice.length > 0) filter.operator_ids = options.cpoFilterChargeprice;
    if(Object.keys(filter).length > 0) attributes.filter = filter;

    return attributes;
  }

  buildRelationships(){
    const options = this.sidebar.chargingOptions();
    // The wallet is a premium feature: the free version only uses direct payment tariffs
    const tariffs = this.sidebar.premiumGate.isRestricted() ? [] : options.myTariffs.map(t=>({ id: t.id, type: "tariff" }));

    return {
      tariffs: { data: tariffs },
      vehicle: { data: { id: options.myVehicle.id, type: options.myVehicle.type } }
    };
  }

  async accessToken(){
    try {
      return await new FetchValidAccessToken(this.depts).run();
    }
    catch(error){
      return null; // Not logged in
    }
  }

  onChargeStopClicked(step){
    if(this.stationSelectedCallback){
      this.stationSelectedCallback({ id: step.station_id, latitude: step.latitude, longitude: step.longitude, network: step.operator_name });
    }
  }

  onToggleAlternatives(step){
    this.editingChargeStopId = this.editingChargeStopId == step.id ? null : step.id;
    if(this.editingChargeStopId) this.analytics.log('event', 'route_planner_alternatives_opened');
    this.render();
  }

  onShowAlternativeOnMap(station){
    this.analytics.log('event', 'route_planner_alternative_shown');
    if(this.stationSelectedCallback) this.stationSelectedCallback({ id: station.id, latitude: station.latitude, longitude: station.longitude });
  }

  onShowResult(){
    this.showResult = true;
    this.render();
  }

  onEdit(){
    this.showResult = false;
    this.render();
  }

  showTrip(trip){
    this.tripId = trip.id;
    this.isSaved = trip.isSaved;
    this.route = trip.route;
    this.editingChargeStopId = null;
    this.showResult = true;
    this.eventBus.publish("trip.created", this.route);
  }

  // Battery range [from%, to%] if the station is a selected charging stop of the current route, otherwise null
  chargeStopBatteryRange(stationId){
    if(!this.route || !stationId) return null;
    const stop = this.route.steps.find(step=>step.type == "charge_stop" && step.station_id == stationId);
    if(!stop) return null;

    const from = Math.round(stop.state_of_charge_start * 100);
    // The price calculation needs a range of at least 1%
    const to = Math.max(Math.round(stop.state_of_charge_end * 100), from + 1);
    return [from, Math.min(to, 100)];
  }

  // ---------- Charging stop replacement ----------

  // Charge stops for which the station is an alternative (and not already the selected station)
  chargeStopsForStation(stationId){
    if(!this.route) return [];
    return this.route.steps.filter(step=>
      step.type == "charge_stop" &&
      step.station_id != stationId &&
      (step.station_candidates || []).some(candidate=>candidate.station_id == stationId)
    );
  }

  // Button for the station detail page, empty if the station isn't an alternative on the current route
  chargeStopActionTemplate(station){
    if(this.chargeStopsForStation(station.id).length == 0) return "";
    const restricted = this.sidebar.premiumGate.isRestricted();

    return html`
      <div class="route-use-station">
        <div class="route-use-station-text"><i class="fa fa-route"></i> ${this.t("routeAlternativeStation")}</div>
        <button @click="${()=>this.onUseAsChargingStop(station)}" ?disabled="${this.saving}" class="w3-btn pc-secondary w3-block w3-round route-use-station-button">
          ${this.saving ? html`<i class="fa fa-spinner fa-spin"></i>` : html`<i class="fa fa-bolt"></i>`} ${this.t("routeUseAsChargingStop")}
          ${restricted ? html`<i class="fa fa-star premium-star-inline"></i>` : ""}
        </button>
      </div>
    `;
  }

  // Replacing a charging stop is a premium feature
  showPremiumScreenIfRestricted(){
    if(!this.sidebar.premiumGate.isRestricted()) return false;
    this.sidebar.premiumGate.showPremiumScreen("route_charge_stop_replace");
    return true;
  }

  onUseAsChargingStop(station){
    if(this.showPremiumScreenIfRestricted()) return;

    const chargeStops = this.chargeStopsForStation(station.id);
    if(chargeStops.length == 1){
      this.replaceChargeStop(chargeStops[0], station);
      return;
    }

    // Alternative for several charging stops: the user chooses which one to replace
    new GenericList(this.depts).show({
      items: chargeStops,
      header: this.t("routeChooseChargeStop"),
      convert: stop=>`${stop.station_name} (${Math.round(stop.state_of_charge_start * 100)}-${Math.round(stop.state_of_charge_end * 100)}%)`,
      narrow: true
    }, stop=>this.replaceChargeStop(stop, station));
  }

  async replaceChargeStop(chargeStop, station){
    if(this.showPremiumScreenIfRestricted()) return;

    const accessToken = await this.accessToken();
    // Changing a trip requires a logged in user
    if(!accessToken){
      new Authorization(this.depts).render();
      return;
    }

    this.saving = true;
    this.render();

    try {
      const trip = await this.trips.update(this.tripId, {
        charge_stop: { id: chargeStop.id, new_station_id: station.id },
        is_saved: this.isSaved
      }, accessToken);
      this.showTrip(trip);
      this.analytics.log('event', 'route_planner_charge_stop_replaced');
      if(this.chargeStopReplacedCallback) this.chargeStopReplacedCallback(station);
    }
    catch(error){
      console.error(error);
      alert(this.t("routeUpdateError"));
    }

    this.saving = false;
    this.render();
  }

  onChargeStopReplaced(callback){
    this.chargeStopReplacedCallback = callback;
  }

  // ---------- Saved trips (premium) ----------

  async onToggleSaved(){
    if(this.sidebar.premiumGate.isRestricted()){
      this.sidebar.premiumGate.showPremiumScreen("route_save");
      return;
    }

    const accessToken = await this.accessToken();
    if(!accessToken){
      new Authorization(this.depts).render();
      return;
    }

    this.saving = true;
    this.render();

    try {
      const trip = await this.trips.update(this.tripId, { is_saved: !this.isSaved }, accessToken);
      this.isSaved = trip.isSaved;
      this.analytics.log('event', this.isSaved ? 'route_planner_saved' : 'route_planner_unsaved');
      this.loadSavedTrips(true);
    }
    catch(error){
      console.error(error);
      alert(this.t(error && error.code == "TOO_MANY_SAVED_TRIPS" ? "routeTooManySavedTrips" : "routeUpdateError"));
    }

    this.saving = false;
    this.render();
  }

  async loadSavedTrips(force = false){
    if(this.sidebar.premiumGate.isRestricted()) return;
    if(this.savedTripsLoaded && !force) return;
    this.savedTripsLoaded = true;

    try {
      const { profile, accessToken } = await new FetchAccessTokenWithProfile(this.depts).run();
      this.savedTrips = await this.trips.listSaved(profile.userId, accessToken);
    }
    catch(error){
      // Not logged in or not available
      this.savedTrips = [];
    }
    this.render();
  }

  async onOpenSavedTrip(savedTrip){
    this.loading = true;
    this.render();

    try {
      const trip = await this.trips.get(savedTrip.id, await this.accessToken());
      // Show the trip's stops in the form, so it can be edited and recalculated
      this.waypoints = trip.route.steps.filter(step=>step.type == "stop").map((step, idx, stops)=>{
        const placeholder = idx == 0 ? "routePlannerStart" : (idx == stops.length - 1 ? "routePlannerDestination" : "routePlannerStop");
        return Object.assign(this.newWaypoint(placeholder), { place: { name: step.name, latitude: step.latitude, longitude: step.longitude } });
      });
      this.showTrip(trip);
      this.analytics.log('event', 'route_planner_saved_trip_opened');
    }
    catch(error){
      console.error(error);
      this.error = this.t("routeError");
    }

    this.loading = false;
    this.render();
  }

  async onDeleteSavedTrip(savedTrip){
    if(!confirm(this.t("routeDeleteTripConfirm"))) return;

    try {
      await this.trips.update(savedTrip.id, { is_saved: false }, await this.accessToken());
      this.savedTrips = this.savedTrips.filter(trip=>trip.id != savedTrip.id);
      if(savedTrip.id == this.tripId) this.isSaved = false;
      this.analytics.log('event', 'route_planner_saved_trip_deleted');
    }
    catch(error){
      console.error(error);
      alert(this.t("routeUpdateError"));
    }
    this.render();
  }

  onClearRoute(){
    this.route = null;
    this.tripId = null;
    this.isSaved = false;
    this.showResult = false;
    this.render();

    this.eventBus.publish("trip.deleted");
    this.analytics.log('event', 'route_planner_deleted');
  }
}
