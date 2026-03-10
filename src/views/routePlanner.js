import { html, render } from 'lit-html';

import ViewBase from '../component/viewBase';
import LocationSearchBox from '../component/locationSearchBox';
import ModalFeedback from '../modal/feedback';

export default class RoutePlanner extends ViewBase{
  constructor(sidebar,depts) {
    super(depts);
    this.sidebar = sidebar;
    this.depts = depts;
    this.locationSearch = depts.locationSearch();
    this.settingsPrimitive = depts.settingsPrimitive();
    this.eventBus = depts.eventBus();
    this.analytics = this.depts.analytics();
    this.currentRoute = this.defaultRoute();
    this.repoTrips = depts.trips();
    this.initializeCurrentRoute();
  }

  template(){
    return html`

      ${this.currentRoute.waypoints.map((wp,idx)=>
        html`
        <div>
          <location-search-box placeholder="${wp.placeholder}" placeName="${wp.place ? wp.place.name : null}" @place-changed="${(res)=>this.placeChanged(res.detail,idx)}" @removed="${()=>this.onRemoveStop(idx)}"></location-search-box>
        </div>
        `
      )}

      <div class="w3-margin-top">
        <input type="checkbox" class="w3-check" @change="${(e)=>this.currentRoute.excludeMotorway = e.target.checked}" ?checked="${this.currentRoute.excludeMotorway}">
        <span>${this.t("routeExcludeMotorway")}</span>
      </div>
      <div class="w3-margin-top">
        <input type="checkbox" class="w3-check" @change="${(e)=>this.currentRoute.excludeTollRoad = e.target.checked}" ?checked="${this.currentRoute.excludeTollRoad}">
        <span>${this.t("routeExcludeTollRoad")}</span>
      </div>
      <button @click="${()=>this.onCalculate()}" class="w3-btn pc-secondary w3-margin-top">${this.t("routePlannerCalculate")}</button>
      <button @click="${()=>this.onAddStop()}" class="w3-btn pc-secondary w3-margin-top">${this.t("routePlannerAddStop")}</button>
      
      ${this.resultTemplate()}

      ${this.feedbackTemplate()}
    `;
  }

  stopTemplate(stop){
    return html`
      <div class="w3-margin-top w3-padding price-row ">
        <i class="fa-solid ${stop.stop_type == "destination" ? "fa-flag-checkered" : "fa-location-dot"}"></i> <b>${stop.name}</b><br>
        <i class="fa-solid fa-battery-three-quarters"></i> ${stop.state_of_charge*100}%
      </div>
    `;
  }

  chargeStopTemplate(stop){
    return html`
      <div class="w3-margin-top w3-padding price-row ">
        <i class="fa-solid fa-charging-station"></i></i> <b>${stop.station_name}</b><br>
        ${stop.charge_point_count}x ${stop.power} kW · ${stop.operator_name}<br>
        <i class="fa-solid fa-battery-three-quarters"></i> ${stop.state_of_charge_start*100}% <i class="fa-solid fa-arrow-right"></i> ${stop.state_of_charge_end*100}% · 
        <i class="fa-solid fa-clock"></i> ${this.h().time(stop.duration)} ·
        <i class="fa-solid fa-wallet"></i> ${stop.price} ${stop.currency}
      </div>
    `;
  }

  routeLegTemplate(segment){
    return html`
      <div class="w3-margin-top w3-padding w3-center">
        ${this.h().time(segment.duration)} · ${this.h().dec(segment.distance/1000)} km<br>
      </div>
    `;
  }

  resultTemplate(){
    if(this.currentRoute.route == null) return "";

    return html`
        <div class="w3-margin-top w3-margin-bottom w3-padding price-row ">
          <b>${this.h().time(this.currentRoute.route.total_duration)} · ${this.h().dec(this.currentRoute.route.total_distance/1000)} km</b><br>
          <i class="fa-solid fa-road"></i> ${this.h().time(this.currentRoute.route.total_driving_duration)}<br>
          <i class="fa-solid fa-charging-station"></i> ${this.currentRoute.route.charge_stop_count} ${this.t("routePlannerChargeStops")}
          (${this.h().time(this.currentRoute.route.total_charging_duration)})<br>
          <i class="fa-solid fa-wallet"></i> XX EUR
        </div>

        <hr>

        <div>${this.currentRoute.route.steps.map(step => 
          step.type == "charge_stop" ? this.chargeStopTemplate(step) : 
            (step.type == "route_leg" ? this.routeLegTemplate(step) : this.stopTemplate(step))
        )}</div>

        <button @click="${()=>this.onClearRoute()}" class="w3-btn w3-red w3-margin-top w3-small">${this.t("routePlannerClearRoute")}</button>
    `;
  }

  feedbackTemplate(){
    return html`
      <div style="margin-top: 32px">${this.t("routePlannerFeedbackText")}</div>
      <button @click="${()=>this.onGiveFeedback()}" class="w3-btn pc-secondary w3-margin-top">${this.t("fbGiveFeedback")}</button>
    `;
  }

  render(){
    render(this.template(),this.getEl("routeContent"));
  }

  onGiveFeedback(){
    new ModalFeedback(this.depts).show("other_feedback");
  }

  onRemoveStop(idx){
    if(this.currentRoute.waypoints.length <= 2) return;

    this.currentRoute.waypoints.splice(idx, 1);
    this.render();
  }

  placeChanged(place,idx){
    this.analytics.log('event', 'location_search_click', { 
      button: "route_planner",
      location_name: place.name,
      longitude: place.longitude,
      latitude: place.latitude 
     });

    this.currentRoute.waypoints[idx].place = place;
  }

  onAddStop(){
    this.currentRoute.waypoints.push({ placeholder: this.t("routePlannerStop") });
    this.render();
  }

  onClearRoute(){
    this.currentRoute = this.defaultRoute();
    this.render();
    
    this.settingsPrimitive.setObject("currentRoute",null);
    this.eventBus.publish("route.deleted");
    this.analytics.log('event', 'route_planner_deleted');
  }

  async onCalculate(){
    const allWaypointsFilled = this.currentRoute.waypoints.every(wp=>wp.place != null);
    if(!allWaypointsFilled){
      alert("Please fill all waypoints!");
      return;
    }

    const waypointLocations = this.currentRoute.waypoints.map(wp=>wp.place);
    const vehicleId = this.sidebar.chargingOptions().myVehicle.id;
    const tariffIds = this.sidebar.chargingOptions().myTariffs.map(t=>t.id);
    const exclude = [];
    if(this.currentRoute.excludeMotorway) exclude.push("motorway");
    if(this.currentRoute.excludeTollRoad) exclude.push("toll");
    const trip = await this.repoTrips.create(waypointLocations, vehicleId, tariffIds, exclude);

    this.currentRoute.route = trip.routes.find(r => trip.selectedRouteId == r.id);

    this.render();

    this.eventBus.publish("route.created", this.currentRoute);

    this.settingsPrimitive.setObject("currentRoute",this.currentRoute);
    this.analytics.log('event', 'route_planner_calculate', { number_of_steps: waypointLocations.length-2 });
  }

  defaultRoute(){
    return {
      waypoints: [{placeholder: this.t("routePlannerStart")},{placeholder: this.t("routePlannerDestination")}],
      excludeMotorway: false,
      excludeTollRoad: false,
    }
  }

  initializeCurrentRoute(){
    const currentRoute = this.settingsPrimitive.getObject("currentRoute");
    if(currentRoute==null) return;

    this.currentRoute = currentRoute;
    this.render();

    this.eventBus.publish("route.created", this.currentRoute);
  }
}