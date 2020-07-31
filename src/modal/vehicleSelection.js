import {html, render} from 'lit-html';
import ModalBase from './base';
import ModalFeedback from './feedback';

export default class VehicleSelection extends ModalBase {
  constructor(depts){
    super(depts);
    this.depts = depts;
    this.analytics = depts.analytics();
  }

  template(){
    return html`
    <div class="w3-modal-content" style="width: 400px">
      ${this.header(this.t("myVehicle"))}
      ${this.step == 1 ? this.step1Template() : this.step2Template()}
      <button @click="${()=>this.onReportMissingVehicle()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
        ${this.t("fbReportMissingVehicleHeader")}
      </button>
    </div>
    `
  }

  step1Template(){
    return html`
      <div class="w3-row cp-margin-small">
        ${this.brands.sort((a,b)=>a.localeCompare(b)).map(brand=>html`
          <span @click="${()=>this.selectBrand(brand)}" class="w3-button w3-light-gray cp-margin-small">
            ${brand}
          </span>
        `)}
      </div>
    `;
  }

  step2Template(){
    return html`
      <div class="w3-row cp-margin-small">
        <span class="w3-tag pc-main cp-margin-small">
          <span @click="${()=>this.backToBrand()}" class="w3-button">&times;</span>
          ${this.vehicles[0].brand}
        </span>
      </div>
      <div class="w3-row cp-margin-small">
        ${this.vehicles.sort((a,b)=>a.name.localeCompare(b.name)).map(v=>html`
          <span @click="${()=>this.selectVehicle(v)}" class="w3-button w3-light-gray cp-margin-small">
            ${v.name}
          </span>
        `)}
      </div>
    `;
  }

  show(allVehicles, callback){
    this.callback = callback;
    this.allVehicles = allVehicles;
    this.brands = allVehicles.reduce((memo, obj) => {
      if(!memo.includes(obj.brand))memo.push(obj.brand);
      return memo;
    },[]);
    this.step = 1;
    this.renderTemplate();
    this.getEl(this.root).style.display = 'block';
  }

  renderTemplate(){
    render(this.template(),this.getEl(this.root));
  }

  backToBrand(){
    this.step = 1;
    this.renderTemplate();
  }

  selectBrand(brand){
    this.vehicles = this.allVehicles.filter(v=>v.brand == brand);
    this.step = 2
    this.renderTemplate();
  }

  selectVehicle(vehicle){
    this.analytics.log('send', 'event', 'VehicleSelected', vehicle.name);
    this.analytics.log('send', 'event', 'VehicleBrandSelected', vehicle.brand);
    this.hide();
    if(this.callback) this.callback(vehicle);
  }

  hide(){
    this.getEl(this.root).style.display = 'none';
  }

  onReportMissingVehicle(){
    new ModalFeedback(this.depts).show("missing_vehicle");
  }
}