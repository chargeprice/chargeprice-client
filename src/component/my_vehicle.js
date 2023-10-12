import VehicleSelection from '../modal/vehicleSelection';
import { html, render } from 'lit-html';
import UpdateUserSettings from '../useCase/updateUserSettings';

export default class MyVehicle {
  constructor(sidebar,depts, userSettings) {
    this.sidebar = sidebar;
    this.depts = depts;
    this.repoVehicle = depts.vehicle();
    this.allVehicles = [];
    this.myVehicle = null;
    this.defaultVehicleId = "7de25a64-e9fa-484f-bf99-d02b02cfb17d"; // Model 3 LR
    this.initVehicles(userSettings);
  }

  template(){
    return html`
      <span @click="${()=>this.changeVehicle()}" class="w3-button w3-light-gray">
        ${this.myVehicle.brand} ${this.myVehicle.name}
      </span>
    `;
  }

  async initVehicles(userSettings){
    let vehicleId = userSettings.data.vehicle.id;

    const currentVehicle = await this.repoVehicle.find(vehicleId);
    this.vehicleChanged(currentVehicle);
  }

  async changeVehicle(){
    new VehicleSelection(this.depts).show((v)=>this.vehicleChanged(v));
  }

  vehicleChanged(vehicle){
    this.myVehicle = vehicle;
    new UpdateUserSettings(this.depts).run({vehicle: { id: vehicle.id, type: vehicle.type }})
    this.sidebar.optionsChanged();
    render(this.template(),document.getElementById("selectVehicle"));
  }

  getVehicle(){
    return this.myVehicle;
  }
}