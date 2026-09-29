import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';

// Vehicle selection in three levels: brand -> model -> variant
export default class VehicleSelectionSidebar extends ViewBase {
  constructor(sidebar, depts) {
    super(depts);
    this.sidebar = sidebar;
    this.repoVehicle = depts.vehicle();
    this.analytics = depts.analytics();
    this.root = "vehicleSelectionContent";

    this.level = "brands";
    this.brands = [];
    this.models = [];
    this.selectedBrand = null;
    this.selectedModel = null;
    this.filterText = "";
    this.loading = false;
    this.error = false;
  }

  template() {
    return html`
      <div class="w3-padding">
        ${this.level == "models" ? this.backButtonTemplate(this.t("vehicleSelectionBackToBrands"), ()=>this.showBrands()) : ""}
        ${this.level == "variants" ? this.backButtonTemplate(this.t("vehicleSelectionBackToModels"), ()=>this.showModels(this.selectedBrand)) : ""}

        ${this.level != "brands" ? html`<p class="vehicle-selection-heading header-font">${this.headingText()}</p>` : ""}

        ${this.level != "variants" ? html`
          <input
            .value="${this.filterText}"
            @input="${(e)=>this.onFilterChanged(e.target.value)}"
            placeholder="${this.t(this.level == "brands" ? "vehicleSelectionSearchBrand" : "vehicleSelectionSearchModel")}"
            class="w3-input w3-border vehicle-selection-search"/>
        ` : ""}
      </div>

      ${this.loading ? html`<div class="w3-center w3-padding"><i class="fa fa-spinner fa-spin"></i></div>` : ""}
      ${this.error ? html`<p class="w3-container w3-text-red">${this.t("vehicleSelectionError")}</p>` : ""}

      ${!this.loading && !this.error ? this.listTemplate() : ""}

      <div class="w3-container w3-padding-16">
        <a href="#" class="link-text w3-small" @click="${(e)=>{e.preventDefault(); this.onReportMissingVehicle();}}">${this.t("fbReportMissingVehicleHeader")}</a>
      </div>
    `;
  }

  backButtonTemplate(text, action) {
    return html`
      <button @click="${action}" class="w3-button w3-light-grey w3-small w3-round vehicle-selection-back">
        <i class="fa fa-chevron-left"></i> ${text}
      </button>
    `;
  }

  headingText() {
    if(this.level == "models") return this.selectedBrand.name;
    return `${this.selectedBrand.name} ${this.selectedModel.name}`;
  }

  listTemplate() {
    switch(this.level) {
      case "brands": return this.brandsTemplate();
      case "models": return this.modelsTemplate();
      default: return this.variantsTemplate();
    }
  }

  brandsTemplate() {
    const current = this.currentVehicle();
    return html`
      <div class="vehicle-selection-list">
        ${this.filter(this.brands, b=>b.name).map(brand=>html`
          <div @click="${()=>this.showModels(brand)}" class="price-flex-container price-row cp-clickable vehicle-selection-row">
            <span class="vehicle-selection-name">${brand.name}</span>
            ${current && current.brandId == brand.id ? html`<i class="fa fa-check pc-main-text"></i>` : ""}
            <i class="fa fa-chevron-right vehicle-selection-chevron"></i>
          </div>
        `)}
      </div>
    `;
  }

  modelsTemplate() {
    const current = this.currentVehicle();
    return html`
      <div class="vehicle-selection-list">
        ${this.filter(this.models, m=>m.name).map(model=>html`
          <div @click="${()=>this.showVariants(model)}" class="price-flex-container price-row cp-clickable vehicle-selection-row">
            <span class="vehicle-selection-name">${model.name}</span>
            ${current && model.vehicles.some(v=>v.id == current.id) ? html`<i class="fa fa-check pc-main-text"></i>` : ""}
            <span class="w3-small w3-text-dark-gray vehicle-selection-count">${model.vehicles.length}</span>
            <i class="fa fa-chevron-right vehicle-selection-chevron"></i>
          </div>
        `)}
      </div>
    `;
  }

  variantsTemplate() {
    const current = this.currentVehicle();
    return html`
      <div class="vehicle-selection-list">
        ${this.selectedModel.vehicles.map(v=>html`
          <div @click="${()=>this.selectVehicle(v)}" class="price-flex-container price-row cp-clickable vehicle-selection-row ${current && current.id == v.id ? "vehicle-selection-current" : ""}">
            <div class="vehicle-selection-variant">
              <div>${v.variant || v.model}</div>
              ${v.releaseYear ? html`<div class="w3-small">${v.releaseYear}</div>` : ""}
              <div class="w3-small w3-text-dark-gray">
                <i class="fa fa-battery-full"></i> ${v.usableBatterySize} kWh* | AC ${v.acMaxPower} kW ${v.dcMaxPower ? html`| DC ${v.dcMaxPower} kW` : ""}
              </div>
            </div>
            ${current && current.id == v.id ? html`<i class="fa fa-check pc-main-text"></i>` : ""}
          </div>
        `)}
      </div>
      <div class="w3-container w3-small w3-margin-top">*${this.t("myVehicleBatteryInfo")}</div>
    `;
  }

  async open() {
    this.filterText = "";
    await this.showBrands();
  }

  async showBrands() {
    this.level = "brands";
    this.filterText = "";
    await this.load(async ()=>{ this.brands = await this.repoVehicle.brands(); });
  }

  async showModels(brand) {
    this.level = "models";
    this.selectedBrand = brand;
    this.filterText = "";
    await this.load(async ()=>{
      const vehicles = await this.repoVehicle.byBrand(brand.id);
      this.models = this.groupIntoModels(vehicles);
    });
  }

  showVariants(model) {
    this.level = "variants";
    this.selectedModel = model;
    this.rerender(true);
  }

  async load(func) {
    this.loading = true;
    this.error = false;
    this.rerender(true);

    try {
      await func();
    }
    catch(ex) {
      console.error(ex);
      this.error = true;
    }

    this.loading = false;
    this.rerender();
  }

  // One entry per model name, the release year is shown on the variants
  groupIntoModels(vehicles) {
    const groups = {};
    vehicles.forEach(v=>{
      if(!groups[v.model]) groups[v.model] = { name: v.model, vehicles: [] };
      groups[v.model].vehicles.push(v);
    });

    // Newest variants first, then by battery size
    return Object.values(groups)
      .map(g=>{ g.vehicles.sort((a,b)=>(b.releaseYear || 0) - (a.releaseYear || 0) || (a.usableBatterySize || 0) - (b.usableBatterySize || 0)); return g; })
      .sort((a,b)=>a.name.localeCompare(b.name));
  }

  filter(list, text) {
    const filterText = this.filterText.trim().toLowerCase();
    if(filterText.length == 0) return list;
    return list.filter(entry=>text(entry).toLowerCase().includes(filterText));
  }

  onFilterChanged(value) {
    this.filterText = value;
    this.rerender();
  }

  selectVehicle(vehicle) {
    this.analytics.log('event', 'vehicle_changed',{
      brand: vehicle.brand,
      model: vehicle.name,
      vehicle_id: vehicle.id
    });

    this.sidebar.myVehicle.vehicleChanged(vehicle);
    this.sidebar.close();
  }

  onReportMissingVehicle() {
    this.sidebar.feedback.missingVehicle();
  }

  currentVehicle() {
    return this.sidebar.myVehicle.getVehicle();
  }

  rerender(scrollToTop = false) {
    render(this.template(), this.getEl(this.root));
    if(scrollToTop) this.getEl("sidebar").scrollTop = 0;
  }
}
