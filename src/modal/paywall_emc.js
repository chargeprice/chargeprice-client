import {html} from 'lit-html';
import ModalBase from './base';
import Authorization from '../component/authorization';
import ModalActivateProducts from './activateProducts';

// What the EMC membership unlocks (the premium features)
const FEATURES = [
  "Alle Tarife und Preise an jeder Station",
  "Preise direkt auf der Karte",
  "Deine Ladekarten im Wallet",
  "Filter nach Betreibern",
  "Routenplaner mit deinen Tarifen"
];

// Premium features on EMC (with PAYWALL_ENABLED) are exclusive for EMC members.
// Same look as the welcome screen (white hero with the EMC logo).
export default class ModalPaywallEmc extends ModalBase {
  constructor(depts){
    super(depts);
  }

  show(loggedIn = false){
    this.loggedIn = loggedIn;
    super.show();
  }

  template(){
    return html`
    <div class="w3-modal-content w3-animate-top welcome-modal">
      <div class="welcome-hero welcome-hero-light">
        <button @click="${()=>this.hide()}" class="w3-button paywall-emc-close" title="Schließen">
          <i class="fa fa-times"></i>
        </button>
        <div class="welcome-hero-content">
          <img src="themes/emc/emc-logo-full.png" alt="EMC" class="welcome-hero-logo welcome-hero-logo-large">
          <p class="header-font welcome-hero-title">Exklusiv für EMC-Mitglieder</p>
          <p class="welcome-hero-text">
            Ladepreise.at ist die Plattform des ElektroMobilitätsClub Österreich für transparente E-Ladekosten,
            im In- und Ausland.
          </p>
        </div>
      </div>

      <div class="welcome-body">
        <ul class="paywall-emc-features">
          ${FEATURES.map(feature=>html`<li><i class="fa fa-check-circle pc-main-text"></i> ${feature}</li>`)}
        </ul>

        ${this.loggedIn ? html`
          <button @click="${()=>this.onActivateMembership()}" class="w3-btn pc-secondary welcome-cta">
            EMC Mitgliedschaft bestätigen
          </button>
        ` : html`
          <button @click="${()=>this.onOpenLogin()}" class="w3-btn pc-secondary welcome-cta">
            Login oder Account erstellen
          </button>
        `}

        <a href="https://www.emcaustria.at/" target="_blank" class="w3-btn welcome-cta paywall-emc-secondary">
          Noch kein EMC-Mitglied? Hier Mitglied werden
        </a>

        <div class="welcome-vehicle-hint paywall-emc-hint">
          <i class="fa fa-info-circle"></i>
          <p>
            ${this.loggedIn ?
              `Wähle "EMC Austria Mitgliedschaft" und gib deine Mitgliedsnummer und die Kartennummer ein. Beides findest du auf deiner EMC Mitgliedskarte.` :
              `Für die Nutzung von Ladepreise.at muss ein eigener Account über unseren Partner Chargeprice erstellt werden.`}
          </p>
        </div>

        <button @click="${()=>this.hide()}" class="w3-button welcome-later">Schließen</button>
      </div>
    </div>
    `;
  }

  onActivateMembership(){
    new ModalActivateProducts(this.depts).show();
  }

  onOpenLogin(){
    new Authorization(this.depts).render();
  }
}
