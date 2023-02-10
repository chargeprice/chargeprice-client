import {html, render} from 'lit-html';
import ModalBase from './base';
import ModalFeedback from './feedback';

export default class VehicleSelection extends ModalBase {
  constructor(depts){
    super(depts);
    this.depts = depts;
    this.repoVehicle = depts.vehicle();
    this.analytics = depts.analytics();
    this.searchTerm = "";
    this.searchResults = [];
    this.autocompleteNonce = 0;
  }

  template(){
    return html`
    <div class="w3-modal-content" style="width: 400px">
      ${this.header(this.t("myVehicle"))}
      
      <div class="w3-row">
        <input @keyup="${(e)=>this.onFilterList(e.srcElement.value)}" placeholder="${this.t("searchPlaceholder")}" class="w3-input w3-border w3-padding"/>
        <ul class="w3-ul no-user-select">
          ${this.searchResults.map(v=>html`
            <li @click="${()=>this.selectVehicle(v)}" class="cp-clickable">
              <div><strong>${v.brand}</strong> ${v.name}</div>
              <div class="w3-small">
                <i class="fa fa-battery-full"></i> ${v.usableBatterySize} kWh | AC ${v.acMaxPower} kW ${v.dcMaxPower ? html`| DC ${v.dcMaxPower} kW` : ""}
              </div>
            </li>
          `)}
        </ul>
      </div>

      <button @click="${()=>this.onReportMissingVehicle()}" class="w3-btn pc-secondary w3-margin">
        ${this.t("fbReportMissingVehicleHeader")}
      </button>
    </div>
    `
  }

  show(callback){
    this.callback = callback;
    this.renderTemplate();
    this.getEl(this.root).style.display = 'block';
  }

  renderTemplate(){
    render(this.template(),this.getEl(this.root));
  }

  selectVehicle(vehicle){
    this.analytics.log('event', 'vehicle_changed',{
      brand: vehicle.brand,
      model: vehicle.name,
      vehicle_id: vehicle.id
    });

    this.hide();
    if(this.callback) this.callback(vehicle);
  }

  hide(){
    this.getEl(this.root).style.display = 'none';
  }

  onReportMissingVehicle(){
    new ModalFeedback(this.depts).show("missing_vehicle");
  }

  onFilterList(searchTerm){
    const nonce = ++this.autocompleteNonce;
    if(searchTerm.length >=3){
      setTimeout(()=>this.autocompleteFinish(nonce, searchTerm),500);
    }
  }

  async autocompleteFinish(nonce, searchTerm){
    if(this.autocompleteNonce!=nonce) return;
    this.searchTerm=searchTerm;
    await this.searchVehicles();
    this.renderTemplate();
  }

  async searchVehicles(){
    this.searchResults = await this.repoVehicle.search(this.searchTerm);
  }

  fullVehicleName(vehicle){
    return `${vehicle.brand} ${vehicle.name}`;
  }

}