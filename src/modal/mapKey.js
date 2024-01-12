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
          <img src="img/markers/multiple_fast.png" class="key-marker">
          ${this.t("fastChargerMultiInfo")}
        </span>
        <p>
          <div class="key-marker my-location-icon"></div> ${this.t("myLocationPin")}
        </p>
        <p>
          <img src="img/markers/search.svg" class="key-marker"> ${this.t("searchResultPin")}
        </p>
      </div>
    </div>
    `
  }
}

