import { html, render } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';

import ViewBase from '../component/viewBase';
import '../component/locationSearchBox';
import Trips from '../repository/trips';
import FetchValidAccessToken from '../useCase/fetchValidAccessToken';
import AppUpsellBanner from '../component/appUpsellBanner';

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
    this.route = null;
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
      <div class="route-result-actions">
        <button @click="${()=>this.onEdit()}" class="w3-btn w3-light-grey w3-small w3-round"><i class="fa fa-pencil"></i> ${this.t("routeEdit")}</button>
        <button @click="${()=>this.onClearRoute()}" class="w3-btn w3-light-grey w3-small w3-round"><i class="fa fa-times"></i> ${this.t("routePlannerClearRoute")}</button>
      </div>

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
    `;
  }

  chargeStopsSummary(route){
    if(route.chargeStopCount == 0) return this.t("routeNoChargeStops");
    const key = route.chargeStopCount == 1 ? "routeChargeStopsSummaryOne" : "routeChargeStopsSummary";
    return this.sf(this.t(key), route.chargeStopCount, this.h().time(route.totalChargingDuration));
  }

  stepsTemplate(steps){
    let firstChargeStop = true;

    return steps.map(step=>{
      switch(step.type){
        case "route_leg":
          return html`<div class="route-leg">${this.h().time(step.duration)} - ${this.formatDistance(step.distance)}</div>`;
        case "stop":
          return this.stopTemplate(step);
        case "charge_stop": {
          const showHint = firstChargeStop && !this.settingsPrimitive.getBoolean("routeCandidatesHintDismissed", false);
          firstChargeStop = false;
          return this.chargeStopTemplate(step, showHint);
        }
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

  chargeStopTemplate(step, showHint){
    return html`
      <div class="route-card route-charge-stop cp-clickable" @click="${()=>this.onChargeStopClicked(step)}">
        <div class="route-charge-stop-name"><i class="fa fa-bolt"></i> ${step.station_name}</div>
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
        ${showHint ? html`
          <div class="route-hint" @click="${(e)=>e.stopPropagation()}">
            <span>${this.t("routeCandidatesHint")}</span>
            <i class="fa fa-times cp-clickable" @click="${()=>this.onDismissHint()}"></i>
          </div>
        ` : ""}
      </div>
    `;
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

      this.route = trip.route;
      this.showResult = true;
      this.eventBus.publish("trip.created", this.route);
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
      user_products: ((this.sidebar.userSettings.meta || {}).products) || []
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

  onDismissHint(){
    this.settingsPrimitive.setBoolean("routeCandidatesHintDismissed", true);
    this.render();
  }

  onShowResult(){
    this.showResult = true;
    this.render();
  }

  onEdit(){
    this.showResult = false;
    this.render();
  }

  onClearRoute(){
    this.route = null;
    this.showResult = false;
    this.render();

    this.eventBus.publish("trip.deleted");
    this.analytics.log('event', 'route_planner_deleted');
  }
}
