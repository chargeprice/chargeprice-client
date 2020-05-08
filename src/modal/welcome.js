import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModalWelcome extends ModalBase {
  constructor(depts){
    super(depts);
  }

  template(){
    return html`
    <div class="w3-modal-content">
      ${this.header(this.t("popupWelcomeHeader"))}
      <div class="w3-container w3-padding">
        <p>${this.t("popupWelcomeText1")}</p>
        <p>${this.t("popupWelcomeText2")}</p>
      </div>
      <button @click="${()=>this.hide()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
        ${this.t("popupWelcomeCTA")}
      </button>
    </div>
    `
  }
}

