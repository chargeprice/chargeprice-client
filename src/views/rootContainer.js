import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
import Authorization from '../component/authorization';
import GenericList from '../modal/genericList';


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
  }

  template(){
    return html`
      <div class="flex-container">
        <div class="flex-item-s w3-bar pc-main" id="top-bar">
          <div class="w3-bar-item w3-large"><div id="logo-container"></div></div>

          ${this.menuItems().map(item=>item.url ? html`
            <a href="${item.url}" target="_blank" class="w3-button w3-hover-dark-gray w3-bar-item top-bar-menu-item">${item.title}</a>
          `: html`
            <button @click="${()=>item.action()}" class="w3-button w3-hover-dark-gray w3-bar-item top-bar-menu-item">${item.title}</button>
          `)}
          <button id="top-bar-burger" @click="${()=>this.onOpenMenu()}" class="w3-button w3-hover-dark-gray w3-bar-item">
            <i class="fa fa-bars"></i>
          </button>

          <div class="top-bar-right">
            ${this.accountTemplate()}
            ${this.themeLoader.isDefaultTheme() ? html`
            <button @click="${()=>this.onChangeLanguage()}" class="w3-button w3-hover-dark-gray w3-bar-item" style="height: 100%;">
              <span class="fi fi-${this.translation.currentLocaleConfig().flag}" style="font-size:1.2em;"></span>
            </button>
            ` : ""}
          </div>
        </div>

        <div class="flex-item-d flex-container  w3-light-gray" style="height: auto">
          <div id="sidebar" class="w3-sidebar w3-white w3-card-4 w3-animate-right">

              <div class="w3-bar pc-secondary">
                <span class="w3-bar-item w3-large"><span id="sidebarHeader" class="header-font"></span></span>
                <button @click="${()=>this.onCloseSidebar()}" class="w3-bar-item w3-button w3-right w3-hover-dark-gray" title="close Sidebar">
                  <img class="inverted" class="w3-button " style="height: 26px;" src="img/close.svg">
                </button>
              </div>

              <div id="infoContent" class="w3-row"></div>
              <div id="pricesContent" class="w3-row"></div>
              <div id="manageMyTariffsContent" class="w3-row"></div>
							<div id="userProfileContent" class="w3-margin-top"></div>
          </div>

          <div id="map-row" class="flex-item-d">
            <div id="preferences" class="w3-white w3-card-4">
              <div class="w3-bar pc-secondary">
                <span id="preferences-tab-search" @click="${()=>this.onSelectPreferencesTab('search')}" class="w3-bar-item w3-button preferences-tab pc-tab-active">${this.t("locationSearchHeader")}</span>
                <span id="preferences-tab-route" @click="${()=>this.onSelectPreferencesTab('route')}" class="w3-bar-item w3-button preferences-tab">${this.t("routePlannerHeader")}</span>
                <button id="preferences-close" @click="${()=>this.onClosePreferences()}" class="w3-bar-item w3-button w3-right w3-hover-dark-gray" title="close">
                  <img class="inverted" class="w3-button " src="img/close.svg">
                </button>
              </div>

              <div id="searchContent" class="w3-container w3-padding-16"></div>
              <div id="routeContent" class="w3-container w3-padding-16" style="display:none"></div>

              <div id="settingsContent" class="w3-container"></div>
            </div>

            <div id="map"></div>
            <button id="preferences-open" @click="${()=>this.onOpenPreferences()}" class="w3-button w3-white w3-card w3-display-topleft" title="${this.t("settingsHeader")}">
              <img src="img/edit.svg">
            </button>
            <div id="map-key" class="w3-display-bottommiddle ${this.customConfig.isIOS() ? "w3-margin-bottom":""}">
              <span class="map-key-item" style="background: #c2e3fd; color: black;">< 50 kW</span><span class="map-key-item" style="background: #0497ff">< 150 kW</span><span class="map-key-item" style="background: #006cb8">>= 150 kW</span>
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
    this.toggle("routeContent", tab === "route");
    this.toggle("settingsContent", tab === "search");
    this.getEl("preferences-tab-search").classList.toggle("pc-tab-active", tab === "search");
    this.getEl("preferences-tab-route").classList.toggle("pc-tab-active", tab === "route");
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
      { title: this.t("menuMobileApp"), url: "https://www.chargeprice.net/en/applications/" },
      { title: this.t("menuDataPlatform"), url: "https://www.chargeprice.net/en/charging-intelligence-data/" },
      { title: this.t("menuInfo"), action: ()=>this.onOpenInfo() }
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

  onChangeLanguage(){
    new GenericList(this.depts).show(
      {
        items: this.translation.getSupportedLocales(),
        header: this.translation.get("displayedLanguageHeader"), 
        convert: i => i.name,
        narrow: true
      },(l)=>window.location = `https://${l.code}.chargeprice.app`);
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

