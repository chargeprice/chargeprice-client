import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
import Authorization from '../component/authorization';
import GenericList from '../modal/genericList';
import PremiumGate from '../component/premiumGate';
import { getColorMode, setColorMode } from '../helper/darkMode';


import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile';

export default class RootContainer extends ViewBase {

  constructor(depts, userSettings){
    super(depts);
    this.customConfig = depts.customConfig();
    this.settingsRepo = depts.settingsPrimitive();
    this.translation = depts.translation();
    this.themeLoader = depts.themeLoader();
    this.profile = null;
    this.userSettings = userSettings;
    this.premiumGate = new PremiumGate(depts, userSettings);
    // The color mode can also be changed in the account panel: refresh the top bar switch
    window.addEventListener("cp-color-mode-changed", ()=>{
      const root = document.getElementById("rootContainer");
      if(root && document.getElementById("top-bar")) render(this.template(), root);
    });
  }

  template(){
    return html`
      <div class="flex-container">
        <div class="flex-item-s w3-bar pc-main" id="top-bar">
          <div class="w3-bar-item w3-large"><div id="logo-container"></div></div>

          <!-- Centered in the bar, independent of the logo and the right side. White labels only
               have one entry (info), so it stays next to the logo there. -->
          <div class="top-bar-menu ${this.themeLoader.isDefaultTheme() ? "" : "top-bar-menu-left"}">
            ${this.menuItems().map(item=>item.url ? html`
              <a href="${item.url}" target="_blank" class="w3-button w3-hover-dark-gray w3-bar-item top-bar-menu-item">${item.title}</a>
            `: html`
              <button @click="${()=>item.action()}" class="w3-button w3-hover-dark-gray w3-bar-item top-bar-menu-item ${item.className || ""}">${item.icon ? html`<i class="fa ${item.icon}"></i>` : ""}${item.title}</button>
            `)}
          </div>
          <button id="top-bar-burger" @click="${()=>this.onOpenMenu()}" class="w3-button w3-hover-dark-gray w3-bar-item">
            <i class="fa fa-bars"></i>
          </button>

          <div class="top-bar-right">
            ${this.accountTemplate()}
            <div id="color-mode-switch" class="w3-bar-item color-mode-switch" role="radiogroup" aria-label="Color mode">
              ${[["light","fa-sun","Light"],["dark","fa-moon","Dark"],["system","fa-desktop","System"]].map(([mode, icon, label])=>html`
                <button type="button" role="radio" aria-checked="${getColorMode() === mode}" aria-label="${label}" title="${label}"
                  class="color-mode-option ${getColorMode() === mode ? "active" : ""}" @click="${()=>this.onSetColorMode(mode)}">
                  <i class="fa ${icon}"></i>
                </button>
              `)}
            </div>
            ${this.themeLoader.isDefaultTheme() ? html`
            <div class="lang-menu w3-bar-item">
              <button id="lang-menu-button" @click="${(e)=>{ e.stopPropagation(); this.onToggleLanguageMenu(); }}"
                class="w3-button w3-hover-dark-gray lang-menu-button" aria-haspopup="listbox" aria-expanded="${!!this.langMenuOpen}"
                title="${this.t("displayedLanguageHeader")}">
                <span class="fi fi-${this.translation.currentLocaleConfig().flag}" style="font-size:1.2em;"></span>
                <i class="fa fa-chevron-${this.langMenuOpen ? "up" : "down"} lang-menu-chevron"></i>
              </button>
              ${this.langMenuOpen ? html`
                <ul class="lang-menu-list" role="listbox" aria-label="${this.t("displayedLanguageHeader")}" @click="${(e)=>e.stopPropagation()}">
                  ${this.translation.getSupportedLocales().map(l => html`
                    <li role="option" aria-selected="${l.code === this.translation.currentLocale}">
                      <button type="button" class="lang-menu-item ${l.code === this.translation.currentLocale ? "active" : ""}"
                        @click="${()=>this.onSelectLanguage(l.code)}">
                        <span class="fi fi-${l.flag}"></span> <span>${l.name}</span>
                        ${l.code === this.translation.currentLocale ? html`<i class="fa fa-check"></i>` : ""}
                      </button>
                    </li>
                  `)}
                </ul>
              ` : ""}
            </div>
            ` : ""}
          </div>
        </div>

        <div class="flex-item-d flex-container  w3-light-gray" style="height: auto">
          <div id="sidebar" class="w3-sidebar w3-white w3-card-4 w3-animate-right">

              <div class="w3-bar pc-secondary">
                <button @click="${()=>this.onCloseSidebar()}" class="w3-bar-item w3-button w3-hover-dark-gray" title="close Sidebar">
                  <img class="inverted" class="w3-button " style="height: 26px;" src="img/arrow-back.svg">
                </button>
                <span id="sidebar-title" class="w3-bar-item w3-large"><span id="sidebarHeader" class="header-font"></span></span>
              </div>

              <div id="infoContent" class="w3-row"></div>
              <div id="pricesContent" class="w3-row"></div>
              <div id="manageMyTariffsContent" class="w3-row"></div>
              <div id="cpoFilterContent" class="w3-row"></div>
              <div id="vehicleSelectionContent" class="w3-row"></div>
							<div id="userProfileContent" class="w3-margin-top"></div>
          </div>

          <div id="map-row" class="flex-item-d">
            <div id="preferences" class="w3-white w3-card-4">
              <div class="w3-bar pc-secondary">
                <button id="preferences-close" @click="${()=>this.onClosePreferences()}" class="w3-bar-item w3-button w3-hover-dark-gray" title="close">
                  <img class="inverted preferences-close-mobile" src="img/arrow-back.svg">
                  <i class="fa fa-chevron-left preferences-close-desktop" aria-hidden="true"></i>
                </button>
                <span id="preferences-tab-search" @click="${()=>this.onSelectPreferencesTab('search')}" class="w3-bar-item w3-button preferences-tab pc-tab-active">${this.t("locationSearchHeader")}</span>
                <span id="preferences-tab-route" @click="${()=>this.onSelectPreferencesTab('route')}" class="w3-bar-item w3-button preferences-tab">${this.t("routePlannerHeader")}</span>
              </div>

              <div id="searchContent" class="w3-container w3-padding-16"></div>
              <div id="routeContent" class="w3-container w3-padding-16" style="display:none"></div>

              <div id="settingsContent" class="w3-container"></div>

              <!-- Always visible at the bottom of the left panel (also in the Info menu as a popup) -->
              <div id="preferences-disclaimer" class="preferences-disclaimer">
                <i class="fa fa-circle-info"></i>
                <span><strong>${this.t("disclaimerHeader")}:</strong> ${this.t("disclaimerContent")}</span>
              </div>
            </div>

            <div id="map"></div>
            <button id="report-missing-station" type="button" @click="${()=>this.onReportMissingStation()}"
              class="w3-btn report-wrong-price-btn map-report-station-btn" title="${this.t("fbReportMissingStationHeader")}">
              <i class="fa fa-flag"></i> <span class="map-report-station-text">${this.t("fbReportMissingStationHeader")}</span>
            </button>
            <button id="preferences-open" @click="${()=>this.onOpenPreferences()}" class="w3-button w3-white w3-card w3-display-topleft" title="${this.t("settingsHeader")}">
              <img src="img/edit.svg">
            </button>
            <div id="map-key" class="w3-display-bottommiddle ${this.customConfig.isIOS() ? "w3-margin-bottom":""}">
              <div id="mapAd" class="map-ad"></div>
              <div class="map-key-row">
                <span class="map-key-item" style="background: #c2e3fd; color: black;">< 50 kW</span><span class="map-key-item" style="background: #0497ff">< 150 kW</span><span class="map-key-item" style="background: #006cb8">>= 150 kW</span>${!this.premiumGate.isPremium() ? html`<span class="map-key-item" style="background: #c79b28">${this.t("mapKeyPromoted")}</span>` : ""}
              </div>
              ${!this.premiumGate.isRestricted() ? html`
                <div class="map-key-row">
                  <span class="map-key-item" style="background: #19a673">${this.t("mapKeyPriceGreen")}</span><span class="map-key-item" style="background: #ff8229">${this.t("mapKeyPriceOrange")}</span><span class="map-key-item" style="background: #f74a56">${this.t("mapKeyPriceRed")}</span>
                </div>
              `:""}
            </div>
          </div>
        </div>
      </div>

      <div id="snackbar"></div>

      <div id="messageDialog" class="w3-modal"></div>
    `;
  }

  accountTemplate(){
    if(!this.profile) return html`
      <span @click="${()=>this.onTriggerAuthModal()}" class="w3-bar-item w3-button auth-options" style="display: flex;">
        <span class="auth-options-text w3-hide-small">${this.t("authLogInBtnText")} / ${this.t("authSignUpBtnText")}</span>
        <i class="fa fa-user"></i>
      </span>
    `;
    return html`
      <div class="w3-bar-item auth-profile cp-clickable" @click="${() => this.onOpenUserProfile()}">
        <div class="auth-details">
          <p>${this.profile.username} ${this.userSettings.isPro ? "| PRO" : ""}</p>
        </div>
        <i class="fa fa-user"></i>
      </div>
    `;
  }

  async render(){
    await this.loadProfile();
    render(this.template(),document.getElementById("rootContainer"));
  }

  async loadProfile(){
    try {
      const tokenWithProfile = await new FetchAccessTokenWithProfile(this.depts).run();
      this.profile = tokenWithProfile.profile;
    }
    catch(error){
      // Not logged in
    }
  }

  inject(sidebar){
    this.sidebar=sidebar;
  }

  onCloseSidebar(){
    this.sidebar.close();
  }

  onOpenPreferences(){
    this.sidebar.openPreferences();
  }

  onClosePreferences(){
    this.sidebar.closePreferences();
  }

  onSelectPreferencesTab(tab){
    this.toggle("searchContent", tab === "search");
    this.toggle("settingsContent", tab === "search");
    this.toggle("routeContent", tab === "route");
    this.getEl("preferences-tab-search").classList.toggle("pc-tab-active", tab === "search");
    this.getEl("preferences-tab-route").classList.toggle("pc-tab-active", tab === "route");
    if(tab === "route"){
      this.sidebar.routePlanner.render();
      this.sidebar.routePlanner.loadSavedTrips();
    }
  }

  onOpenInfo(){
    this.sidebar.open("info")
  }

	onOpenUserProfile(){
    this.sidebar.open("userProfile")
  }

  menuItems(){
    if(!this.themeLoader.isDefaultTheme()){
      return [{ title: this.t("menuInfo"), action: ()=>this.onOpenInfo() }];
    }

    return [
      ...(this.premiumGate.showsUpsells() ? [
        { title: this.t("menuUpgradePremium"), action: ()=>this.premiumGate.showPremiumScreen("menu"), className: "top-bar-premium", icon: "fa-star" }
      ] : [])
    ];
  }

  onOpenMenu(){
    new GenericList(this.depts).show(
      {
        items: this.menuItems(),
        header: this.t("menuHeader"),
        convert: i => i.title,
        narrow: true
      },(item)=>item.url ? window.open(item.url, "_blank") : item.action());
  }

  // Asks the user to tap the location of the missing station on the map, then opens the feedback form
  onReportMissingStation(){
    const map = this.sidebar && this.sidebar.userProfile && this.sidebar.userProfile.map;
    if(!map) return;
    this.showAlert(this.t("fbMissingStationSelectOnMap"));
    document.getElementById("map").classList.add("map-picking-location");
    map.registerClickOnce(event=>{
      document.getElementById("map").classList.remove("map-picking-location");
      this.sidebar.feedback.missingStation(event.location);
    });
  }

  onSetColorMode(mode){
    setColorMode(mode); // re-renders through the "cp-color-mode-changed" event
  }

  // Language: dropdown under the flag (replaces the popup)
  onToggleLanguageMenu(open = !this.langMenuOpen){
    this.langMenuOpen = open;
    render(this.template(), document.getElementById("rootContainer"));
    if(open && !this.langMenuListeners){
      this.langMenuListeners = true;
      document.addEventListener("click", ()=>{ if(this.langMenuOpen) this.onToggleLanguageMenu(false); });
      document.addEventListener("keydown", (e)=>{ if(e.key === "Escape" && this.langMenuOpen) this.onToggleLanguageMenu(false); });
    }
  }

  onSelectLanguage(code){
    this.onToggleLanguageMenu(false);
    if(code !== this.translation.currentLocale) this.translation.changeLocale(code);
  }

  onChangeLanguage(){
    new GenericList(this.depts).show(
      {
        items: this.translation.getSupportedLocales(),
        header: this.translation.get("displayedLanguageHeader"), 
        convert: i => i.name,
        narrow: true
      },(l)=>this.translation.changeLocale(l.code));
  }

  showAlert(message) {
    this.getEl("snackbar").innerText = message;
    this.show("snackbar");

    setTimeout(()=>this.hide("snackbar"), 5000);
  }

  onTriggerAuthModal() {
    new Authorization(this.depts).render();
  }
}

