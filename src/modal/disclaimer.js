import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModelDisclaimer extends ModalBase {
  constructor(depts){
    super(depts);
  }

  template(){
    return html`
    <div class="w3-modal-content">
      ${this.header(this.t("disclaimerHeader"))}
      <div class="w3-container w3-padding">
        ${this.t("disclaimerContent")}
      </div>
    </div>
    `
  }
}

