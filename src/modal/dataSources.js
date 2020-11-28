import {html, render} from 'lit-html';
import ModalBase from './base';

export default class ModelDataSources extends ModalBase {
  constructor(depts){
    super(depts);
  }

  template(){
    return html`
    <div class="w3-modal-content">
      ${this.header(this.t("dataSourceHeader"))}
      <div class="w3-container w3-padding">
        <ul>
          <li>${this.ut("dataSourceContentGoingElectric")}</li>
          <li>${this.t("dataSourceContentOther")}</li>
        </ul>

        <p>
          <a href="https://github.com/chargeprice/chargeprice-api-docs" target="_blank">Chargeprice API (Github)</a>
        </p>
        <label class="w3-margin-top w3-large">${this.t("openSourceHeader")}</label><br>
        <div class="w3-margin-bottom">
          <a href="https://github.com/chargeprice/chargeprice-client" target="_blank">Chargeprice (Github)</a><br>
          <a href="https://github.com/chargeprice/open-ev-data" target="_blank">Open EV Data (Github)</a><br>
        </div>
      </div>
    </div>
    `
  }
}

