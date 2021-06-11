import { html, render } from 'lit-html';

import ViewBase from '../component/viewBase';

export default class RoutePlanner extends ViewBase{
  constructor(sidebar,depts) {
    super(depts);
    this.sidebar = sidebar;
    this.depts = depts;
    this.locationSearch = depts.locationSearch();
    this.eventBus = depts.eventBus();
    this.result = null;
  }

  template(){
    return html`
      <input id="startLocation" placeholder="Starting Point" class="w3-input w3-border"/>
      <input id="destinationLocation" placeholder="Destination" class="w3-input w3-border w3-margin-top"/>

      <button @click="${()=>this.onCalculate()}" class="w3-btn pc-secondary w3-margin-top">Calculate</button>
    
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

  async onCalculate(){
    const startLocationString = this.getEl("startLocation").value;
    const destinationLocationString = this.getEl("destinationLocation").value;

    const startLocation = await this.locationSearch.getAutocomplete(startLocationString);
    const destinationLocation = await this.locationSearch.getAutocomplete(destinationLocationString);
    const waypoints = [startLocation[0], destinationLocation[0]];

    const route = await this.locationSearch.getDirections(waypoints);
    
    this.result = {
      waypoints: waypoints,
      route: route
    } 

    this.render();

    this.eventBus.publish("route.created", this.result);
  }
}