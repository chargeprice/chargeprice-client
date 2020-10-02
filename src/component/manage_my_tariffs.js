require('jsrender')($);
import { html, render } from 'lit-html';

import StationTariffs from '../repository/station_tariffs.js';
import ProviderFeaturing from './providerFeaturing';
import ViewBase from './viewBase';

export default class ManageMyTariffs extends ViewBase{
  constructor(sidebar,depts) {
    super(depts);
    this.sidebar = sidebar;
    this.depts = depts;
    this.analytics = depts.analytics();
    this.allTariffs = [];
    this.myTariffIds = [];
    this.loadAllTariffs();
    this.loadFromStorage();
    this.sortedTariffs = [];
    this.filterText = "";
  }

  template(tariffs){
    return html`
      <div class="w3-margin-bottom">${this.t("manageMyTariffsDescription")}</div>

      <input @keyup="${(e)=>this.onFilterList(e.srcElement.value)}" placeholder="Plugsurfing..." class="w3-input w3-border"/>

      <table id="charge-card-list" class="w3-table w3-striped w3-margin-top">
        <tbody>
        ${tariffs.map(tariff=>html`
          <tr style="${tariff.featuring ? `background: ${tariff.featuring.backgroundColor} !important;`:""}">
            <td width="50">
            ${
              this.myTariffIds.includes(tariff.id) ?
              html`<button @click="${()=>this.onRemove(tariff)}" class="w3-btn w3-red">-</button>` :
              html`<button @click="${()=>this.onAdd(tariff)}" class="w3-btn w3-green">+</button>`
            }
            </td>
            <td>
              ${tariff.name == null || tariff.name == tariff.provider ?
                html`<span>${tariff.provider}</span>` :
                html`<span>${tariff.name}</span><br>
                    ${!tariff.featuring ? html`<label class="w3-margin-top w3-small">${tariff.provider}</label>`:""}`
              }
              ${tariff.providerCustomerOnly ?
                html`
                  <label class="w3-small w3-block">${this.t("providerCustomerOnly")}</label> 
                `:""}

              ${tariff.featuring ? html`
                <img class="feature-logo" src="${tariff.featuring.logoUrl}"/>
              `:""}
            </td>
          </tr>
        `)}
        </tbody>
      </table>
    `;
  }

  render(){
    const indexedMyTariffs = this.myTariffIds.reduce((memo,t)=>{
      memo[t]=true;
      return memo;
    },{});

    const filteredTariffs  = this.filterText=="" ? this.allTariffs : this.allTariffs.filter(t=>{
      return t.name.toLowerCase().includes(this.filterText) || t.provider.toLowerCase().includes(this.filterText);
    });

    const sortedTariffs = filteredTariffs.sort((a,b)=>{

      const aMy = !!indexedMyTariffs[a.id];
      const bMy = !!indexedMyTariffs[b.id];

      const bF = !!b.featuring;
      const aF = !!a.featuring;

      if(aMy == bMy){
        if(bF == aF) return a.name.localeCompare(b.name);
        else return bF - aF; // Show featured providers
      }
      else return bMy - aMy; // Show selected first
    });

    render(this.template(sortedTariffs),this.getEl("manageMyTariffsContent"));
  }

  onFilterList(filterText){
    this.filterText=filterText.toLowerCase();
    this.render();
  }

  onAdd(tariff) {
    if(this.myTariffIds.includes(tariff.id)) return;
    this.myTariffIds.push(tariff.id);
    this.render();
    this.saveToStorage();
  }

  onRemove(tariff){
    this.myTariffIds = this.myTariffIds.filter(id=>id != tariff.id);
    this.render();
    this.saveToStorage();
  }

  onBack(){
    this.sidebar.open("settings");
    this.saveToStorage();
  }

  async loadAllTariffs(){
    this.allTariffs = (await new StationTariffs(this.depts).getAllTariffs()).data;
    this.addFeaturings(this.allTariffs);
  }

  loadFromStorage(){
    this.myTariffIds = JSON.parse(localStorage.getItem("myTariffIds")) || [];  
  }

  addFeaturings(tariffs){
    const featurings = new ProviderFeaturing().getFeaturedProviders();
    tariffs.forEach(t=>t.featuring = featurings[t.provider]);
  }

  saveToStorage(){
    localStorage.setItem("myTariffIds",JSON.stringify(this.myTariffIds));
    this.analytics.log('send', 'event', 'MyTariffs', 'save',null,this.myTariffIds.length);
  }

  getMyTariffs(){
    return this.allTariffs.filter(t=>this.myTariffIds.includes(t.id));
  }
}