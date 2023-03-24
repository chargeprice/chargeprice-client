import {html, render} from 'lit-html';
import ViewBase from './viewBase';

export default class LocationSearch extends ViewBase {
  constructor(depts) {
    super(depts);
    this.analytics = depts.analytics();
    this.locationSearch = depts.locationSearch();
    this.eventBus = depts.eventBus();
    this.root = "search";
    this.callback = null;
    this.autocompleteNonce = 0;
  }

  template(){
    return html`
      <div class="w3-row">
        <button id="jump-to-my-location" @click="${()=>this.onShowRoutePlaner()}" class="w3-button w3-light-gray w3-border w3-col">
          <i class="fa fa-directions"></i>
        </button>
        <button id="jump-to-my-location" @click="${()=>this.onMyLocation()}" class="w3-button w3-light-gray w3-border w3-col">
          <i class="fa fa-dot-circle-o"></i>
        </button>
        <div class="w3-rest">
          <input id="search-box" @keyup="${(e)=>this.onKeyUp(e)}" @focusout="${()=>this.onFocusOut()}" class="w3-border w3-input w3-padding" placeholder="${this.t('locationSearchPlaceholder')}"/>
          <div id="searchResult"></div>
        </div>
      </div>
    `
  }

  searchResultTemplate(results,emptyMessage){
    if(results.length==0){
      return emptyMessage !=null ? html`<span class="w3-white w3-block w3-small">${emptyMessage}</span>` : "";
    }
    return html`
      <ul class="w3-ul w3-border w3-white">
        ${results.map(entry=> html`<li @mousedown="${()=>this.onPlaceChanged(entry)}">${entry.name}</li>`)}
      </ul>
      <span class="w3-white w3-block w3-small"><a href="https://locationiq.com">Search by LocationIQ.com</a></span>
    `;
  }

  render(){
    render(this.template(),this.getEl(this.root));
    this.showResults([]);
  }

  onFocusOut(){
    this.showResults([])
  }

  onShowRoutePlaner(){
    this.analytics.log('event', 'route_planner_open');
    this.eventBus.publish("sidebar.change",{ sidebar: "route" })
  }

  onKeyUp(event){
    const nonce = ++this.autocompleteNonce;
    const searchTerm = event.srcElement.value;
    if(searchTerm.length >=3){
      setTimeout(()=>this.autocompleteFinish(nonce, searchTerm),500);
    }
  }

  autocompleteFinish(nonce, value){
    if(this.autocompleteNonce!=nonce) return;
    this.onSearchTermChanged(value);
  }

  onPlaceChanged(place) {
    this.showResults([]);
    this.analytics.log('event', 'location_search_click', { 
      button: "my_location",
      location_name: place.name,
      longitude: place.longitude,
      latitude: place.latitude 
    });

    if(this.searchResultCallback) this.searchResultCallback(place);
  }

  async onSearchTermChanged(searchTerm) {
    if(searchTerm.length==0) return;

    // check if search term is latitude and longitude via regex
    const latLongRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = searchTerm.match(latLongRegex);
    if(match){
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);
      const place = { latitude: lat, longitude: lng };
      this.onPlaceChanged(place);
      return;
    }
    
    try {
      const results = await this.locationSearch.getAutocomplete(searchTerm);
      this.showResults(results);
    }
    catch(ex){
      if(ex=="429"){
        this.analytics.log('event', 'location_search_rate_limit_exceeded');
      } 
    }
  }

  showResults(results,emptyMessage=null){
    render(this.searchResultTemplate(results,emptyMessage),this.getEl("searchResult"));
  }

  onMyLocation(){
    this.analytics.log('event', 'go_to_my_location');
    if(this.myLocationCallback) this.myLocationCallback();
  }

  onCenterMyLocation(callback){
    this.myLocationCallback = callback;
  }

  onResultSelected(callback){
    this.searchResultCallback = callback;
  }
}