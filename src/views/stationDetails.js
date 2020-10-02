import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
export default class StationDetailsView extends ViewBase {
  constructor(depts) {
    super(depts);
    this.customConfig = depts.customConfig();
  }

  template(station){
    const url = `${this.customConfig.isIOS() ? 'maps' : 'https' }://maps.google.com/maps?daddr=${station.latitude},${station.longitude}&ll=`;
    return html`
      <label class="w3-margin-top w3-large">${station.name}</label><br>    
      <label>${station.address}</label><br>    
      
      ${station.priceDescription ? html`<div class="w3-margin-top">${station.priceDescription}</div>`:""}
      <div class="cp-margin-top-small">
        ${station.isFreeParking ? html`<span class="w3-tag w3-green cp-margin-top-small">${this.t("freeParking")}</span>`:""}
        ${station.isFreeCharging  ? html`<span class="w3-tag w3-green cp-margin-top-small">${this.t("freeCharging")}</span>`:""}
        ${station.network  ? html`
          <span class="w3-tag w3-light-gray cp-margin-top-small">
            <label><i class="fa fa-sitemap"></i> ${station.network}</label>
          </span>
        `:""}
        ${station.goingElectricUrl ? html`
          <span class="w3-tag w3-light-gray cp-margin-top-small">
            <a href="${station.goingElectricUrl}" target="_blank"><i class="fa fa-external-link"></i> ${this.t("goingElectricLink")}</a>
          </span>
        `:""}
        <span class="w3-tag w3-light-gray cp-margin-top-small">
          <a href="${url}" target="_blank"><i class="fa fa-location-arrow"></i> ${this.t("openInMapsLink")}</a>
        </span>
      </div>
    `;
  }

  render(station,root){
    render(this.template(station),document.getElementById(root));
  }
}

