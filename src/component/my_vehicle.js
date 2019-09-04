require('jsrender')($);

import StationTariffs from '../repository/station_tariffs.js';

export default class MyVehicle {
  constructor(sidebar,analytics) {
    this.sidebar = sidebar;
    this.allVehicles = [];
    this.myVehicle = null;
    this.defaultVehicleId = "7de25a64-e9fa-484f-bf99-d02b02cfb17d"; // Model 3 LR
    this.registerTemplates();
    this.initVehicles();
  }

  registerTemplates(){
    $.templates("vehicleTempl",`
      {{for vehicleGroups}}
        <optgroup label="{{:brand}}">
        {{for vehicles}}
          <option value="{{:id}}" {{if selected}}selected{{/if}}>{{:name}}</option>
        {{/for}}
        </optgroup> 
      {{/for}}
    `);
  }

  async initVehicles(){
    this.allVehicles = (await new StationTariffs().getAllVehicles()).data;

    let vehicleId = this.defaultVehicleId;

    if(localStorage.getItem("myVehicle")){
      vehicleId = JSON.parse(localStorage.getItem("myVehicle")).id;
    }

    this.myVehicle = this.allVehicles.find(v => v.id == vehicleId);

    this.allVehicles.forEach(v => v.selected = (v.id == this.myVehicle.id));

    const vehicleGroups = this.groupVehiclesByBrand();
    $("#selectVehicle").html($.render.vehicleTempl({ vehicleGroups: vehicleGroups }));
    $("#selectVehicle").on('change', ()=>this.vehicleChanged());

    this.vehicleChanged();
  }

  groupVehiclesByBrand(){
     const rawGroups = this.allVehicles.reduce((memo, obj) => {
        (memo[obj.brand] = memo[obj.brand] || []).push(obj);
        return memo;
      },{});
    
    const groups = [];
    for(var brand in rawGroups){
      groups.push(
        {
          brand: brand,
          vehicles: rawGroups[brand].sort((a,b)=>a.name.localeCompare(b.name))
        }
      )
    }
    return groups;
  }

  vehicleChanged(){
    const id = $("#selectVehicle").val();
    this.myVehicle = this.allVehicles.find(v => v.id == id);
    localStorage.setItem("myVehicle",JSON.stringify(this.myVehicle));
    this.sidebar.optionsChanged();
  }

  getVehicle(){
    return this.myVehicle;
  }
}