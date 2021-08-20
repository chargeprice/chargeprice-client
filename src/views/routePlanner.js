import { html, render } from 'lit-html';

import ViewBase from '../component/viewBase';
import LocationSearchBox from '../component/locationSearchBox';

export default class RoutePlanner extends ViewBase{
  constructor(sidebar,depts) {
    super(depts);
    this.sidebar = sidebar;
    this.depts = depts;
    this.locationSearch = depts.locationSearch();
    this.eventBus = depts.eventBus();
    this.result = null;
    this.waypoints = [{placeholder: "Starting point"},{placeholder: "Destination"}]
  }

  template(){
    return html`

      ${this.waypoints.map((wp,idx)=>
        html`
        <div>
          <location-search-box placeholder="${wp.placeholder}" placeName="${wp.place ? wp.place.name : null}" @place-changed="${(res)=>this.placeChanged(res.detail,idx)}" @removed="${()=>this.onRemoveStop(idx)}"></location-search-box>
        </div>
        `
      )}

      <button @click="${()=>this.onCalculate()}" class="w3-btn pc-secondary w3-margin-top">Calculate</button>
      <button @click="${()=>this.onAddStop()}" class="w3-btn pc-secondary w3-margin-top">Add Stop</button>
    
      ${this.resultTemplate()}
    `;
  }

  resultTemplate(){
    if(this.result == null) return "";

    return html`
      <ul class="w3-margin-top">
        <li>Distance: ${this.h().dec(this.result.route.distance/1000)} km</li>
        <li>Duration: ${this.h().time(this.result.route.distance/1000)}</li>
      </ul>
    `;
  }

  render(){
    
    render(this.template(),this.getEl("routeContent"));
  }

  onRemoveStop(idx){
    if(this.waypoints.length <= 2) return;

    this.waypoints.splice(idx, 1);
    this.render();
  }

  placeChanged(place,idx){
    this.waypoints[idx].place = place;
  }

  onAddStop(){
    this.waypoints.push({ placeholder: "Stop" });
    this.render();
  }

  async onCalculate(){
    const allWaypointsFilled = this.waypoints.every(wp=>wp.place != null);
    if(!allWaypointsFilled){
      alert("Please fill all waypoints!");
      return;
    }

    const waypoints = this.waypoints.map(wp=>wp.place);

    const route = await this.locationSearch.getDirections(waypoints);
    
    this.result = {
      waypoints: waypoints,
      route: route
    } 

    this.render();

    this.eventBus.publish("route.created", this.result);
  }
}