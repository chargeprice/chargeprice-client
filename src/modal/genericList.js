import {html, render} from 'lit-html';
import ModalBase from './base';

export default class GenericList extends ModalBase {
  constructor(depts){
    super(depts);
  }

  template(config){
    return html`
    <div class="w3-modal-content" style=${config.narrow ? "width: 400px": ""}>
      ${this.header(config.header)}
      
      <div class="w3-row">
        ${config.items.map(item=>html`
          <span @click="${()=>this.selectItem(item)}" class="w3-button w3-light-gray cp-margin-small ${this.enabled(item) ? "" : "w3-disabled"}">
            ${config.convert(item)}
          </span>
        `)}
      </div>
    </div>
    `
  }

  // config: items, header, convert(), narrow
  show(config, callback){
    this.callback = callback;
    this.config = config;
    render(this.template(config),this.getEl(this.root));
    this.getEl(this.root).style.display = 'block';
  }

  selectItem(item){
    if(!this.enabled(item)) return;
    this.hide();
    if(this.callback) this.callback(item);
  }

  enabled(item){
    return !this.config.enabled || this.config.enabled(item);
  }

  hide(){
    this.getEl(this.root).style.display = 'none';
  }
}

