import { html, render } from 'lit-html';
import ViewBase from './viewBase';
export default class PricesSidebar extends ViewBase {
  constructor(depts) {
    super(depts);
    this.analytics = depts.analytics();
    this.themeLoader = depts.themeLoader();
  }

  template(){
    return html`
      <div class="w3-container w3-margin-top">
        <div id="station-info"></div>
        <div id="select-charge-point"></div>
      </div>
      <div class="w3-container">
        <label id="batteryRangeInfo" class="w3-block"></label>
        <div id ="batteryRange" class="w3-margin-top"></div>

        <label id="parameterNote" class="w3-margin-bottom w3-margin-top w3-medium w3-block"></label>
      </div>

      <div id="priceInfo" class="w3-container"></div>

      <div id="prices"></div> 
      <div id="priceFeedback" class="w3-margin-top w3-container w3-margin-bottom"></div>
      
      ${this.themeLoader.isDefaultTheme() ? html`
        <div @click="${()=>this.openProLink()}" class="w3-margin-top w3-container pc-main cp-clickable w3-padding" style="padding-bottom: 12px !important">
          <i class="fa fa-plus-circle "></i> <span>${this.t("infoProHeader")}</span>
          <span class="w3-small w3-block">${this.t("infoProSub")}</span>
        </div>
      `:""}
    `;
  }

  render(){
    render(this.template(),document.getElementById("pricesContent"));
  }

  openProLink(){
    this.analytics.log('event', 'price_list_pro_clicked');
    window.open("https://www.chargeprice.net")
  }
}

