import {html} from 'lit-html';
import ModalBase from './base';
import Authorization from '../component/authorization';

export default class ModalPaywallEmc extends ModalBase {
  constructor(depts){
    super(depts);
  }

  template(){
    return html`
    <div class="w3-modal-content">
      <div class="w3-container w3-padding w3-center">
        <div style="margin:16px 0 8px;">
          <img src="themes/emc/emc-logo-full.png" style="height:60px;vertical-align:middle;">
          <p class="pc-main-text header-font" style="font-size:1.4em;font-weight:600;margin:8px 0 0;">Willkommen bei Ladepreise.at</p>
        </div>

        <p class="pc-main-text" style="margin-top:16px;text-align:left;">
          Willkommen bei ladepreise.at – die Plattform des ElektroMobilitätsClub Österreich für transparente E-Ladekosten.
          Finde passende Ladestationen im In- und Ausland und sieh auf einen Blick, was deine nächste Ladung kostet.<br>
          Exklusiv für EMC-Mitglieder.
        </p>

        <div class="w3-margin-top">
          <a href="https://www.emcaustria.at/" target="_blank" style="display:block; text-decoration:none;">
            <button class="w3-btn pc-secondary w3-block w3-margin-bottom">
              Noch kein EMC-Mitglied? Hier Mitglied werden
            </button>
          </a>
          <button @click="${()=>this.onOpenLogin()}" class="w3-btn pc-secondary w3-block">
            Login oder Account erstellen
          </button>
        </div>

        <div class="w3-panel w3-pale-yellow w3-leftbar w3-border-yellow w3-margin-top" style="border-radius:6px;text-align:left;">
          <p class="w3-small">Für die Nutzung von Ladepreise.at muss ein eigener Account über unseren Partner Chargeprice erstellt werden.</p>
        </div>
      </div>
    </div>
    `;
  }

  onOpenLogin(){
    new Authorization(this.depts).render();
  }
}
