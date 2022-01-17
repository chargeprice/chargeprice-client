import { html, render } from 'lit-html';
var dayjs = require('dayjs');
import ViewBase from '../component/viewBase';
import GenericPopup from '../modal/genericPopup';
export default class StationDetailsView extends ViewBase {
  constructor(depts) {
    super(depts);
    this.depts = depts;
    this.customConfig = depts.customConfig();
  }

  template(station){
    const url = `${this.customConfig.isIOS() ? 'maps' : 'https' }://maps.google.com/maps?daddr=${station.latitude},${station.longitude}&ll=`;
    return html`
      <label class="w3-margin-top w3-large">${station.name}</label><br>    
      <label>${station.address}</label><br>    
      
      <div class="cp-margin-top-small">
        ${station.faultReported ? html`<span class="w3-tag w3-link w3-red cp-margin-top-small" @click="${()=>this.onFaultReport(station)}">
          <i class="fa fa-exclamation"></i> ${this.t("faultReported")}</span>`:""}
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

        ${this.customConfig.isBeta() && ["DE","Deutschland"].includes(station.country) ? html`
          <iframe style="width: 150px; height: 23px; border: none;  display: inline-block; vertical-align: bottom;" src="https://scoring-widget.prod.elvah.de/v1/scoring?proximity=${station.longitude},${station.latitude}"></iframe>
        `:""}

        ${this.customConfig.isInternalMode() ? this.internalTemplate(station) : ""}
      </div>
    `;
  }

  internalTemplate(station){
    return html`
      <table id="monitoringTable" class="google-sheets-table">
        <tr>
          <td>${station.network}</td>
          <td>${station.id}</td>
          <td>${station.dataAdapter}</td>
          <td>${station.latitude}</td>
          <td>${station.longitude}</td>
          <td>${station.chargePoints.map(cp=>cp.power).filter((v, i, a) => a.indexOf(v) === i).join(", ")} kW</td>
        </tr>
      </table>
      <table id="poiTable" class="google-sheets-table">
        <tr>
          <td>${station.name}</td>
          <td></td>
          <td>${station.address}</td>
          <td>${station.latitude}</td>
          <td>${station.longitude}</td>
        </tr>
      </table>
      <button @click="${()=>this.copyTableToClipboard("monitoringTable")}">Copy monitoring</button>
      <button @click="${()=>this.copyTableToClipboard("poiTable")}">Copy POI</button>
    `;
  }

  render(station,root){
    render(this.template(station),document.getElementById(root));
  }

  onFaultReport(station){
    const report = station.faultReport;
    const message = `${report.description} (${dayjs(new Date(report.created*1000)).format("DD.MM.YYYY")})`;
    new GenericPopup(this.depts).show({header: this.t("faultReported"), message: message});
  }

  copyTableToClipboard(elementId){
    let el = this.getEl(elementId);
    let body = document.body, range, sel;
    if (document.createRange && window.getSelection) {
        range = document.createRange();
        sel = window.getSelection();
        sel.removeAllRanges();
        try {
            range.selectNodeContents(el);
            sel.addRange(range);
        } catch (e) {
            range.selectNode(el);
            sel.addRange(range);
        }
        document.execCommand("copy");

    } else if (body.createTextRange) {
        range = body.createTextRange();
        range.moveToElementText(el);
        range.select();
        range.execCommand("Copy");
    }
}
}

