import StationTariffs from '../repository/station_tariffs.js';
import VehicleSelection from '../modal/vehicleSelection';
import { html, render } from 'lit-html';
import UpdateUserSettings from '../useCase/updateUserSettings';
import FetchUserSettingsOrCreateFromLocal from '../useCase/fetchUserSettingsOrCreateFromLocal.js';

export default class MyVehicle {
  constructor(sidebar,depts) {
    this.sidebar = sidebar;
    this.depts = depts;
    this.allVehicles = [];
    this.myVehicle = null;
    this.defaultVehicleId = "7de25a64-e9fa-484f-bf99-d02b02cfb17d"; // Model 3 LR
    this.initVehicles();
  }

  template(){
    return html`
      <span @click="${()=>this.changeVehicle()}" class="w3-button w3-light-gray">
        ${this.myVehicle.brand} ${this.myVehicle.name}
      </span>
    `;
  }

  async initVehicles(){
    this.allVehicles = (await new StationTariffs(this.depts).getAllVehicles()).data;
    const settings = await new FetchUserSettingsOrCreateFromLocal(this.depts).run();
    let vehicleId = settings.vehicle.id;

    this.vehicleChanged(this.allVehicles.find(v => v.id == vehicleId));
  }

  changeVehicle(){
    new VehicleSelection(this.depts).show(this.allVehicles,(v)=>this.vehicleChanged(v));
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