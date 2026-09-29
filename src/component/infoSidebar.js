import { html, render } from 'lit-html';
import ViewBase from './viewBase';
import ModalMapKey from '../modal/mapKey';
import ModalSocialMedia from '../modal/socialMedia';
import ModalDisclaimer from '../modal/disclaimer';

export default class InfoSidebar extends ViewBase {
  constructor(depts) {
    super(depts);
    this.analytics = depts.analytics();
    this.themeLoader = depts.themeLoader();
    this.customConfig = depts.customConfig();
    this.appStoreLink = "https://apps.apple.com/app/chargeprice/id1552707493";
    this.playStoreLink = "https://play.google.com/store/apps/details?id=fr.chargeprice.app";
    this.menuItems = [
      {
        id: "pro",
        title: this.t("infoProHeader"),
        subTitle: this.t("infoProSub"),
        icon: "plus-circle",
        action: ()=>window.open("https://www.chargeprice.net")
      },
      {
        id: "map_legend",
        title: this.t("poiKey"),
        icon: "map",
        action: ()=> new ModalMapKey(this.depts).show()
      },
      {
        id: "update",
        title: this.t("refreshHeader"),
        subTitle: this.t("refreshSub"),
        icon: "refresh",
        show: ()=> this.customConfig.isMobileOrTablet(),
        action: ()=> location.reload(true)
      },
      {
        id: "social_media",
        title: this.t("popupSocialMediaHeader"),
        subTitle: this.t("popupSocialMediaText1"),
        icon: "facebook-official",
        show: ()=> this.themeLoader.isDefaultTheme(),
        action: ()=> new ModalSocialMedia(this.depts).show()
      },
      {
        id: "data_sources",
        title: this.t("dataSourceHeader"),
        subTitle: this.t("infoApiSub"),
        icon: "connectdevelop",
        action: ()=>window.open("https://github.com/chargeprice/chargeprice-api-docs")
      },
      {
        id: "feedback",
        title: this.t("fbGiveFeedback"),
        icon: "comment",
        action: ()=>this.onGiveFeedback()
      },
      {
        id: "missing_station",
        title: this.t("fbReportMissingStationHeader"),
        icon: "comment",
        action: ()=>this.onMissingStation()
      },
      {
        id: "disclaimer",
        title: this.t("disclaimerHeader"),
        icon: "legal",
        action: ()=> new ModalDisclaimer(this.depts).show()
      },
      {
        id: "about",
        title: this.t("aboutHeader"),
        subTitle: "chargeprice.net",
        icon: "info-circle",
        action: ()=>window.open("https://www.chargeprice.net")
      }
    ]
  }

  template(){
    return html`
      <div class="w3-bar-block">
        ${!this.themeLoader.isDefaultTheme() ? html`
         <div class="w3-padding w3-border-bottom w3-center">
          <a href="https://www.chargeprice.net" target="_blank"><img id="powered-by" height=50 src="img/powered_by.svg"/></a>
         </div>
        ` : ""
        }
        <div class="w3-padding w3-border-bottom info-app-install">
          <div class="bold"><i class="fa fa-mobile pc-main-text"></i> ${this.t("menuMobileApp")}</div>
          <div class="info-app-badges">
            <a href="${this.appStoreLink}" target="_blank" @click="${()=>this.onAppStoreClicked("ios")}">
              <img src="img/store/app-store-badge.png" alt="Download on the App Store">
            </a>
            <a href="${this.playStoreLink}" target="_blank" @click="${()=>this.onAppStoreClicked("android")}">
              <img src="img/store/play-store-badge.png" alt="Get it on Google Play">
            </a>
          </div>
        </div>
        ${this.menuItems.filter(entry=>!entry.show || entry.show()).map(entry=>html`
          <a @click="${(e)=>{e.preventDefault(); this.executeAction(entry);}}" href="#" class="w3-bar-item w3-button w3-border-bottom">
            <i class="fa fa-${entry.icon} pc-main-text"></i> <span class="${entry.class}">${entry.title}</span>
            ${entry.subTitle ? html`<span class="w3-small w3-block w3-text-dark-gray">${typeof entry.subTitle === "function" ? entry.subTitle() : entry.subTitle}</span>`:""}
          </a>
        `)}

      </div>
    `;
  }

  render(){
    render(this.template(),document.getElementById("infoContent"));
  }

  inject(map, sidebar){
    this.map=map;
    this.sidebar=sidebar;
  }

  onGiveFeedback(){
    this.sidebar.feedback.other();
  }

  onMissingStation(){
    alert(this.t("fbMissingStationSelectOnMap"));

    this.map.registerClickOnce(event=>{
      this.sidebar.feedback.missingStation(event.location);
    });
  }

  onAppStoreClicked(platform){
    this.analytics.log('event', 'app_install_clicked', { platform: platform, source: 'info_menu' });
  }

  executeAction(entry){
    this.analytics.log('event', 'info_sidebar_item_opened',{item_id: entry.id});
    entry.action();
  }
}

