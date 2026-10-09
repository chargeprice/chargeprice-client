import { html, render } from 'lit-html';

import ViewBase from './viewBase';

// Sidebar to select the operators (CPOs) whose stations are shown on the map
export default class ManageCpoFilter extends ViewBase{
  constructor(sidebar, depts) {
    super(depts);
    this.sidebar = sidebar;
    this.depts = depts;
    this.analytics = depts.analytics();
    this.repoCompany = depts.company();
    this.allCpos = [];
    this.selectedCpos = [];
    this.filterText = "";
    this.loadingFailed = false;
    // Country of the map center, the promoted operators depend on it
    this.country = null;
    this.loadedCountry = null;
  }

  template(sections){
    return html`
      <div class="w3-padding">
        <div class="w3-margin-bottom">${this.t("cpoFilterDescription")}</div>
        <input @keyup="${(e)=>this.onFilterList(e.srcElement.value)}" .value="${this.filterText}" placeholder="${this.t("searchPlaceholder")}" class="w3-input w3-border"/>
      </div>

      ${this.loadingFailed ? html`<div class="w3-padding">${this.t("cpoFilterLoadingError")}</div>` : ""}
      ${!this.loadingFailed && this.allCpos.length == 0 ? html`<div class="w3-center w3-padding"><i class="fa fa-spinner fa-spin"></i></div>` : ""}

      <div id="cpo-list">
        ${this.sectionTemplate("cpoFilterSelected", sections.selected)}
        ${this.sectionTemplate("cpoFilterPromoted", sections.promoted)}
        ${this.sectionTemplate(sections.selected.length > 0 || sections.promoted.length > 0 ? "cpoFilterOthers" : null, sections.others)}
      </div>
    `;
  }

  // Without a title key, only the rows are shown
  sectionTemplate(titleKey, cpos){
    if(cpos.length == 0) return "";
    return html`
      ${titleKey ? html`<div class="w3-margin-top price-header header-font"><span class="price-section-title">${this.t(titleKey)}</span></div>` : ""}
      ${cpos.map(cpo=>this.rowTemplate(cpo))}
    `;
  }

  rowTemplate(cpo){
    return html`
      <div class="price-flex-container price-row">
        <div class="tariff-flex-right">
          <span>${cpo.name}</span>
          <!-- The logos are white (for colored backgrounds), inverted they are visible on the light rows -->
          ${this.logoUrl(cpo) ? html`<div><img class="feature-logo inverted" src="${this.logoUrl(cpo)}"/></div>` : ""}
        </div>
        <div class="tariff-flex-left">
        ${
          this.isSelected(cpo) ?
          html`<button @click="${()=>this.onRemove(cpo)}" class="w3-btn w3-red w3-small">${this.t("manageMyTariffsRemove")}</button>` :
          html`<button @click="${()=>this.onAdd(cpo)}" class="w3-btn pc-main w3-small">${this.t("manageMyTariffsSelect")}${this.sidebar.premiumGate.isRestricted() ? html` <i class="fa fa-star premium-star-inline"></i>` : ""}</button>`
        }
        </div>
      </div>
    `;
  }

  async render(){
    // Shows the spinner while loading
    this.renderList();
    await this.ensureAllCposLoaded();
    this.renderList();
  }

  renderList(){
    render(this.template(this.cpoSections()),this.getEl("cpoFilterContent"));
  }

  onFilterList(filterText){
    this.filterText = filterText.toLowerCase();
    this.renderList();
  }

  onAdd(cpo){
    // Filtering operators is a premium feature
    const premiumGate = this.sidebar.premiumGate;
    if(premiumGate.isRestricted()){
      premiumGate.showPremiumScreen("operator_filter");
      return;
    }

    if(this.isSelected(cpo)) return;
    this.selectedCpos = this.selectedCpos.concat([cpo]);
    this.analytics.log('event', 'cpo_filter_added', { cpo_name: cpo.name, total_number: this.selectedCpos.length });
    this.changed();
  }

  onRemove(cpo){
    this.selectedCpos = this.selectedCpos.filter(c=>c.id != cpo.id);
    this.changed();
  }

  changed(){
    this.renderList();
    if(this.changedCallback) this.changedCallback();
  }

  onChanged(callback){
    this.changedCallback = callback;
  }

  // Reloads the operators when the map was moved to another country
  setCountry(country){
    if(!country || country == this.country) return;
    this.country = country;
    if(this.sidebar.currentSidebarContentKey == "cpoFilter") this.render();
  }

  async ensureAllCposLoaded(){
    if(this.allCpos.length > 0 && this.loadedCountry == this.country) return;
    const country = this.country;
    try {
      const cpos = await this.repoCompany.cpos(country);
      // The map was moved to another country while loading
      if(country != this.country) return;
      this.allCpos = cpos;
      this.loadedCountry = country;
      this.loadingFailed = false;
    }
    catch(e){
      this.loadingFailed = true;
    }
  }

  // Selected ones at the top, then the promoted ones, then all others (each alphabetically)
  cpoSections(){
    const filtered = this.filterText == "" ? this.allCpos : this.allCpos.filter(c=>c.name.toLowerCase().includes(this.filterText));
    const sorted = filtered.slice().sort((a,b)=>a.name.localeCompare(b.name));

    return {
      selected: sorted.filter(c=>this.isSelected(c)),
      promoted: sorted.filter(c=>!this.isSelected(c) && this.isPromoted(c)),
      others: sorted.filter(c=>!this.isSelected(c) && !this.isPromoted(c))
    };
  }

  isSelected(cpo){
    return this.selectedCpos.some(c=>c.id == cpo.id);
  }

  isPromoted(cpo){
    return !!(cpo.meta && cpo.meta.promoted);
  }

  // Only promoted operators are shown with their logo
  logoUrl(cpo){
    return this.isPromoted(cpo) && cpo.meta.branding ? cpo.meta.branding.logo_url : null;
  }

  getSelectedCpos(){
    return this.selectedCpos;
  }

  getSelectedCpoIds(){
    return this.selectedCpos.map(c=>c.id);
  }
}
