import {html, render} from 'lit-html';
import ViewBase from '../component/viewBase';

export default class ModalBase extends ViewBase {
  constructor(depts){
    super(depts);
    this.root = "messageDialog";
  }

  header(text,allowClose=true){
    return html`
      <div class="w3-row w3-bar pc-secondary">
        ${allowClose ? html`<button @click="${()=>this.hide()}" class="w3-col w3-button w3-right w3-hover-dark-gray popup-header-close">
          <img class="inverted" class="w3-button " src="img/close.svg">
        </button>` : "" }
        <div class="w3-rest w3-large popup-header header-font">${text}</div>
      </div>
    `;
  }

  show(){
    render(this.template(),this.getEl(this.root));
    this.getEl(this.root).style.display = 'block';
  }

  hide(){
    this.getEl(this.root).style.display = 'none';
  }
}

