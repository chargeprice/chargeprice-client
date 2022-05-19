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

      <button @click="${()=>this.onCalculate()}" class="w3-btn pc-secondary w3-margin-top">${this.t("routePlannerCalculate")}</button>
      <button @click="${()=>this.onAddStop()}" class="w3-btn pc-secondary w3-margin-top">${this.t("routePlannerAddStop")}</button>
      
      ${this.resultTemplate()}

      ${this.feedbackTemplate()}
    `;
  }

  resultTemplate(){
    if(this.currentRoute.route == null) return "";

    return html`
        <div class="w3-margin-top">${this.t("routePlannerDistance")}: ${this.h().dec(this.currentRoute.route.distance/1000)} km</div>

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
    this.analytics.log('event', 'location_search_click', { button: "route_planner" });

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
    this.currentRoute.route = await this.locationSearch.getDirections(waypointLocations);; 

    this.render();

    this.eventBus.publish("route.created", this.currentRoute);

    this.settingsPrimitive.setObject("currentRoute",this.currentRoute);
    this.analytics.log('event', 'route_planner_calculate', { number_of_steps: waypointLocations.length-2 });
  }

  defaultRoute(){
    return {
      waypoints: [{placeholder: this.t("routePlannerStart")},{placeholder: this.t("routePlannerDestination")}]
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