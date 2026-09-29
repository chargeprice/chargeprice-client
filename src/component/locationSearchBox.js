import {html, unsafeCSS, css, LitElement} from 'lit';
import Dependencies from '../helper/dependencies';
import W3 from '../style/w3.css.js';

export class LocationSearchBox extends LitElement {
  static get styles() {
    return [W3.styles(),css`
      #searchResult ul li{
        cursor: pointer;
      }

      /* Same look as the search in the explore tab, but floating above the content,
         so opening/closing the suggestions doesn't move anything */
      #searchResult {
        position: relative;
      }

      #searchResult ul {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 20;
      }

      #search-box {
        outline: none;
      }

      #search-box:focus {
        border-color: #777 !important;
      }

      .w3-input{
        border-radius: 12px;
      }

      .search-box {
        margin-bottom: 8px;
      }

      .current-location-entry {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .current-location-entry svg {
        color: #777;
      }

      .search-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .search-row input {
        flex: 1;
        min-width: 0;
      }

      .remove-button {
        flex: 0 0 auto;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 50%;
        background: #f1f1f1;
        color: #666;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .remove-button:hover {
        background: #e0e0e0;
        color: #222;
      }
    `]
  }

  static get properties() {
    return {
      placeholder: {  },
      placeName: { },
      removable: { type: Boolean },
      // Optional { name, latitude, longitude }, offered as first search result
      currentLocation: { attribute: false },
      _focused: { state: true },
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
    this.removable = false;
    this.currentLocation = null;
    this._focused = false;
    this.autocompleteNonce = 0;
  }

  render() {
    return html`
      <div class="search-box">
        <div class="search-row">
          <input id="search-box" .value="${this.placeName}" @keyup="${(e)=>this.onKeyUp(e)}" @focusin="${()=>this.onFocusIn()}" @focusout="${()=>this.onFocusOut()}" class="w3-border w3-input w3-padding" placeholder="${this.placeholder}"/>
          ${this.removable ? html`
            <button @click="${()=>this.onRemove()}" class="remove-button" title="${this.t("routeRemoveStop")}" aria-label="${this.t("routeRemoveStop")}">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          ` : ""}
        </div>
        <div id="searchResult">${this.searchResultTemplate()}</div>
      </div>
    `;
  }

  searchResultTemplate(){
    const showCurrentLocation = this._focused && this.currentLocation;
    if(this._searchResults.length==0 && !showCurrentLocation){
      return;
    }
    return html`
      <ul class="w3-ul w3-border w3-white">
        ${showCurrentLocation ? html`
          <li @mousedown="${()=>this.onPlaceChanged(this.currentLocation)}" class="current-location-entry">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="4" fill="currentColor"/><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
            ${this.currentLocation.name}
          </li>
        ` : ""}
        ${this._searchResults.map(entry=> html`<li @mousedown="${()=>this.onPlaceChanged(entry)}">${entry.name}</li>`)}
      </ul>
    `;
  }

  onFocusIn(){
    this._focused = true;
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
    this._searchResults = [];
    this._focused = false;
    const input = this.shadowRoot && this.shadowRoot.getElementById("search-box");
    if(input) input.blur();

    let event = new CustomEvent('place-changed', { detail: place });
    this.dispatchEvent(event);

    this.placeName = place.name
  }

  onRemove(){
    this.dispatchEvent(new CustomEvent('removed'));
  }

  onFocusOut(){
    this._searchResults = [];
    this._focused = false;
  }


  t(key){
    return this.translation.get(key);
  }
}

customElements.define('location-search-box', LocationSearchBox);