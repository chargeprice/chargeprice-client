import {html, render} from 'lit-html';
import ViewBase from './viewBase';

export default class LocationSearch extends ViewBase {
  constructor(depts) {
    super(depts.translation());
    this.depts = depts;
    this.analytics = depts.analytics();
    this.locationSearch = depts.locationSearch();
    this.root = "search";
    this.callback = null;
  }

  template(){
    return html`
      <div class="w3-row">
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

  onKeyUp(event){
    if(event.keyCode == 13) this.onSearchTermChanged(event.srcElement.value);
    else this.showResults([],this.t("locationSearchEnterInfo"));
  }

  onPlaceChanged(place) {
    this.showResults([]);
    this.analytics.log('send', 'event', 'LocationSearch','search');

    if(this.searchResultCallback) this.searchResultCallback(place);
  }

  async onSearchTermChanged(searchTerm) {
    if(searchTerm.length==0) return;
    
    try {
      const results = await this.locationSearch.getAutocomplete(searchTerm);
      this.showResults(results);
    }
    catch(ex){
      if(ex=="429"){
        this.analytics.log('send', 'event', 'LocationSearch','rateLimitExceeded');
      } 
    }
  }

  showResults(results,emptyMessage=null){
    render(this.searchResultTemplate(results,emptyMessage),this.getEl("searchResult"));
  }

  onMyLocation(){
    this.analytics.log('send', 'event', 'LocationSearch','currentLocation');
    if(this.myLocationCallback) this.myLocationCallback();
  }

  onCenterMyLocation(callback){
    this.myLocationCallback = callback;
  }

  onResultSelected(callback){
    this.searchResultCallback = callback;
  }
}