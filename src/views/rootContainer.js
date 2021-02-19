import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
export default class RootContainer extends ViewBase {

  constructor(depts){
    super(depts);
    this.customConfig = depts.customConfig();
  }

  template(){
    return html`
      <div class="flex-container">
        <div class="flex-item-s w3-bar pc-main" id="top-bar">
          <div class="w3-bar-item w3-large"><div id="logo-container"></div></div>
          
          <button @click="${()=>this.onOpenSettings()}" class="w3-button w3-hover-dark-gray w3-bar-item"><img class="inverted" src="img/edit.svg"></button>
          <button @click="${()=>this.onOpenInfo()}" class="w3-button w3-hover-dark-gray w3-bar-item"><img class="inverted" src="img/info.svg"></button>
          <div id="loadingIndicator" class="w3-bar-item w3-middle" >
            <img class="inverted" class="w3-button " src="img/refresh-2.svg">
          </div>
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
          </div>

          <div id="map" class="flex-item-d"></div>
          <div id="search" class="w3-display-topright"></div>
          <div id="map-key" class="w3-display-bottommiddle ${this.customConfig.isIOS() ? "w3-margin-bottom":""}">
            <span class="map-key-item" style="background: #565656"><=3.7 kW</span><span class="map-key-item" style="background: #3498db"><= 22 kW</span><span class="map-key-item" style="background: #f49630"><= 50 kW</span><span class="map-key-item" style="background: #9a3032">>50 kW</span>
          </div>

          <div id="pleaseZoom" class="w3-tag w3-padding w3-center" style="display: none;">${this.t("pleaseZoomIn")}</div>
        </div>
      </div>

      <div id="snackbar"></div>
      
      <div id="messageDialog" class="w3-modal">
        <div class="w3-modal-content">
          <div class="w3-bar pc-secondary w3-padding">
            <h3 id="messageDialogHeader"></h3>
          </div>
          <div id="messageDialogContent" class="w3-container w3-padding"></div>
          <button id="messageDialogOk" class="w3-btn pc-secondary w3-margin"></button>
        </div>
      </div>
    `;
  }

  render(){
    render(this.template(),document.getElementById("rootContainer"));
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
}

