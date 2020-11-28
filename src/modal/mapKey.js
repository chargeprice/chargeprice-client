import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModelMapKey extends ModalBase {
  constructor(depts){
    super(depts);
  }

  template(){
    return html`
    <div class="w3-modal-content">
      ${this.header(this.t("poiKey"))}
      <div class="w3-container w3-padding">
        <span>
          <img src="img/markers/fast_multi.png" class="key-marker">
          <img src="img/markers/ultra_multi.png" class="key-marker">
          ${this.t("fastChargerMultiInfo")}
        </span>
        <p>
          <span>
            <img src="img/markers/fast_single_fault.png" class="key-marker">
            ${this.t("faultReported")}
          </span>
        </p>
        <p>
          <div class="key-marker my-location-icon"></div> ${this.t("myLocationPin")}
          <img src="img/markers/search_single.png" class="key-marker w3-margin-left"> ${this.t("searchResultPin")}
        </p>
      </div>
    </div>
    `
  }
}

