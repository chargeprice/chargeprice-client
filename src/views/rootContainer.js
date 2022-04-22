import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
import Authorization from '../component/authorization';

import FetchAccessTokenWithProfile from '../useCase/fetchAccessTokenWithProfile';

export default class RootContainer extends ViewBase {

  constructor(depts){
    super(depts);
    this.customConfig = depts.customConfig();
    this.settingsRepo = depts.settingsPrimitive();
    this.profile = null;
  }

  template(){
    return html`
      <div class="flex-container">
        <div class="flex-item-s w3-bar pc-main" id="top-bar">
          <div>
            <div class="w3-bar-item w3-large"><div id="logo-container"></div></div>

            <button @click="${()=>this.onOpenSettings()}" class="w3-button w3-hover-dark-gray w3-bar-item"><img class="inverted" src="img/edit.svg"></button>
            <button @click="${()=>this.onOpenInfo()}" class="w3-button w3-hover-dark-gray w3-bar-item"><img class="inverted" src="img/info.svg"></button>
            <div id="loadingIndicator" class="w3-bar-item w3-middle" style="padding: 8px;">
              <img class="inverted" class="w3-button " src="img/refresh-2.svg">
            </div>
          </div>

          ${this.accountTemplate()}
        </div>

        <div class="flex-item-d flex-container  w3-light-gray" style="height: auto">
          <div id="sidebar" class="w3-sidebar w3-white w3-card-4 w3-animate-left">

              <div class="w3-bar pc-secondary">
                <span class="w3-bar-item w3-large"><span id="sidebarHeader"></span></span>
                <button @click="${()=>this.onCloseSidebar()}" class="w3-bar-item w3-button w3-right w3-hover-dark-gray" title="close Sidebar">
                  <img class="inverted" class="w3-button " src="img/close.svg">
                </button>
              </div>

              <div id="settingsContent" class="w3-container w3-padding-16"></div>
              <div id="infoContent" class="w3-row"></div>
              <div id="pricesContent" class="w3-row"></div>
              <div id="manageMyTariffsContent" class="w3-container w3-padding-16"></div>
              <div id="routeContent" class="w3-container w3-padding-16"></div>
							<div id="userProfileContent" class="w3-margin-top"></div>
          </div>

          <div id="map" class="flex-item-d"></div>
          <div id="search" class="w3-display-topright"></div>
          <div id="map-key" class="w3-display-bottommiddle ${this.customConfig.isIOS() ? "w3-margin-bottom":""}">
            <span class="map-key-item" style="background: #565656"><=3.7 kW</span><span class="map-key-item" style="background: #3498db"><= 22 kW</span><span class="map-key-item" style="background: #f49630"><= 50 kW</span><span class="map-key-item" style="background: #9a3032">>50 kW</span>
          </div>
        </div>
      </div>

      <div id="snackbar"></div>

      <div id="messageDialog" class="w3-modal"></div>
    `;
  }

  accountTemplate(){
    if(!this.profile) return html`
      <span @click="${()=>this.onTriggerAuthModal()}" class="w3-bar-item w3-button w3-right auth-options" style="display: flex; padding: 8px;">
        <i class="fa fa-sign-in-alt"></i>
      </span>
    `;
    return html`
      <div class="w3-bar-item w3-right auth-profile cp-clickable" @click="${() => this.onOpenUserProfile()}">
        <div class="auth-details">
          <p>${this.profile.username}</p>
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

  onOpenSettings(){
    this.sidebar.open("settings")
  }

  onOpenInfo(){
    this.sidebar.open("info")
  }

	onOpenUserProfile(){
    this.sidebar.open("userProfile")
  }

  toggleLoadingIndicator(isShown){
    this.toggle("loadingIndicator", isShown);
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

