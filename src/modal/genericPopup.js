import {html, render} from 'lit-html';
import ModalBase from './base';
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';

export default class GenericPopup extends ModalBase {
  constructor(depts){
    super(depts);
  }

  template(config){
    return html`
    <div class="w3-modal-content" style=${config.narrow ? "width: 400px": ""}>
      ${this.header(config.header)}
      
      <div class="w3-container w3-padding">
        ${unsafeHTML(config.message)}
      </div>
      <button @click="${()=>this.hide()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
        ${this.t("ok")}
      </button>
    </div>
    `
  }

  show(config){
    this.config = config;
    render(this.template(config),this.getEl(this.root));
    this.getEl(this.root).style.display = 'block';
  }

  hide(){
    this.getEl(this.root).style.display = 'none';
  }
}

