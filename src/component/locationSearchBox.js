import {html, unsafeCSS, css, LitElement} from 'lit';
import Dependencies from '../helper/dependencies';
import W3 from '../style/w3.css.js';

export class LocationSearchBox extends LitElement {
  static get styles() {
    return [W3.styles(),css`
      #searchResult ul li{
        cursor: pointer;
      }
    `]
  }

  static get properties() {
    return {
      placeholder: {  },
      placeName: { },
      _searchResults: { state: true } 
    }
  }

  constructor() {
    super();
    this.depts = Dependencies.getInstance();
    this.locationSearch = this.depts.locationSearch();
    this.translation = this.depts.translation(); 
    this._searchResults = [];
    this.placeName = "";
    this.autocompleteNonce = 0;
  }

  render() {
    return html`
      <div class="w3-margin-top">
        <div class="w3-row">
        <div class="w3-col w3-right" style="width:40px">
            <button @click="${()=>this.onRemove()}" class="w3-btn">X</button>
          </div>
          <div class="w3-rest">
            <input id="search-box" .value="${this.placeName}" @keyup="${(e)=>this.onKeyUp(e)}" @focusout="${()=>this.onFocusOut()}" class="w3-border w3-input w3-padding" placeholder="${this.placeholder}"/>
          </div>
        </div>
        <div id="searchResult">${this.searchResultTemplate()}</div>
      </div>
    `;
  }

  searchResultTemplate(){
    if(this._searchResults.length==0){
      return;
    }
    return html`
      <ul class="w3-ul w3-border w3-white">
        ${this._searchResults.map(entry=> html`<li @mousedown="${()=>this.onPlaceChanged(entry)}">${entry.name}</li>`)}
      </ul>
      <span class="w3-white w3-block w3-small"><a href="https://locationiq.com">Search by LocationIQ.com</a></span>
    `;
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

  async onSearchTermChanged(searchTerm) {
    if(searchTerm.length==0){
      this._searchResults=[];
      return;
    }
    
    this._searchResults = await this.locationSearch.getAutocomplete(searchTerm);
  }

  onPlaceChanged(place) {
    this._searchResults = []    

    let event = new CustomEvent('place-changed', { detail: place });
    this.dispatchEvent(event);

    this.placeName = place.name
  }

  onRemove(){
    this.dispatchEvent(new CustomEvent('removed'));
  }

  onFocusOut(){
    this._searchResults = []
  }


  t(key){
    return this.translation.get(key);
  }
}

customElements.define('location-search-box', LocationSearchBox);