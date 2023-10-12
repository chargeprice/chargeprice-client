import {html, css, LitElement} from 'lit';
import Dependencies from '../helper/dependencies';
import W3 from '../style/w3.css.js';

export class CompanySearchBox extends LitElement {
  static get styles() {
    return [W3.styles(),css`
      #searchResult ul li{
        cursor: pointer;
      }

      .w3-input{
        border-radius: 12px;
      }
    `]
  }

  static get properties() {
    return {
      placeholder: {  },
      companyName: { },
      _searchResults: { state: true } 
    }
  }

  constructor() {
    super();
    this.depts = Dependencies.getInstance();
    this.repoCompany = this.depts.company();
    this._searchResults = [];
    this.companyName = "";
    this.autocompleteNonce = 0;
  }

  render() {
    return html`
      <div>
        <div class="w3-row">
          <input id="search-box" .value="${this.companyName}" @keyup="${(e)=>this.onKeyUp(e)}" @focusout="${()=>this.onFocusOut()}" class="w3-border w3-input w3-padding" placeholder="${this.placeholder}"/>
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
        ${this._searchResults.map(entry=> html`<li @mousedown="${()=>this.onCompanyChanged(entry)}">${entry.name}</li>`)}
      </ul>
    `;
  }

  onKeyUp(event){
    const nonce = ++this.autocompleteNonce;
    const searchTerm = event.srcElement.value;
    this.companyName = searchTerm;
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

    this._searchResults = await this.repoCompany.search(searchTerm);
  }

  onCompanyChanged(company) {
    this._searchResults = []    

    let event = new CustomEvent('company-changed', { detail: company });
    this.dispatchEvent(event);

    this.companyName = "";
  }

  onFocusOut(){
    this._searchResults = []
  }
}

customElements.define('company-search-box', CompanySearchBox);