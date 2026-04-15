import { html, render } from 'lit-html';
import ModalBase from './base';
import UserProducts from '../repository/userProducts';

const SOURCES = [
  { value: "emc_membership", label: "EMC Austria Mitgliedschaft", products: ["mobile_premium"] },
  { value: "carbonify_thg", label: "Carbonify", products: ["mobile_premium"] }
];

export default class ModalActivateProducts extends ModalBase {
  constructor(depts) {
    super(depts);
    this.userProducts = new UserProducts(depts);
    this.error = null;
    this.success = false;
    this.selectedSource = null;
    this.activatedProducts = [];
  }

  template() {
    if (this.success) return this.successTemplate();
    return this.formTemplate();
  }

  formTemplate() {
    return html`
      <div class="w3-modal-content">
        ${this.header(this.t("activateProductsHeader"))}
        <div class="w3-container w3-padding">
          <p>
            <label>${this.t("activateProductsSource")}</label>
            <select id="activateProductsSource" class="w3-select w3-border" @change="${() => this.onSourceChange()}">
              <option value="" selected>${this.t("activateProductsSelectSource")}</option>
              ${SOURCES.map(s => html`<option value="${s.value}">${s.label}</option>`)}
            </select>
          </p>
          ${this.selectedSource === "emc_membership" ? html`
            <p>
              <label>Mitglieds-Nummer (Kartenvorderseite unterhalb des Namens)</label>
              <input id="activateProductsMemberNumber" type="text" class="w3-input w3-border" />
            </p>
            <p>
              <label>Kartennummer (Rückseite, 16-stellig)</label>
              <input id="activateProductsCardNumber" type="text" class="w3-input w3-border" />
            </p>
          ` : ""}
          ${this.selectedSource === "carbonify_thg" ? html`
            <p>
              <label>E-Mail des Carbonify-Accounts</label>
              <input id="activateProductsCarbonifyEmail" type="email" class="w3-input w3-border" />
            </p>
            <p>
              <label>Land</label>
              <select id="activateProductsCarbonifyCountry" class="w3-select w3-border">
                <option value="AT">Österreich</option>
              </select>
            </p>
            <p>
              <label>Quotenjahr</label>
              <select id="activateProductsCarbonifyQuotaYear" class="w3-select w3-border">
                <option value="2026">2026</option>
              </select>
            </p>
          ` : ""}
          ${this.error ? html`<p class="w3-text-red">${this.error}</p>` : ""}
        </div>
        <button @click="${() => this.onSubmit()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left" ?disabled="${!this.selectedSource}">
          ${this.t("activateProductsSubmit")}
        </button>
        <button @click="${() => this.hide()}" class="w3-btn w3-light-grey w3-margin-bottom w3-margin-left">
          ${this.t("cancel")}
        </button>
      </div>
    `;
  }

  successTemplate() {
    return html`
      <div class="w3-modal-content">
        ${this.header(this.t("activateProductsHeader"))}
        <div class="w3-container w3-padding">
          <p>${this.t("activateProductsSuccessful")}</p>
          <ul>
            ${this.activatedProducts.map(p => html`<li>${this.t(`activateProducts${p.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('')}`)}</li>`)}
          </ul>
        </div>
        <button @click="${() => location.reload(true)}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
          ${this.t("activateProductsReload")}
        </button>
      </div>
    `;
  }

  rerender() {
    render(this.template(), this.getEl(this.root));
  }

  onSourceChange() {
    this.selectedSource = this.getEl("activateProductsSource").value;
    this.error = null;
    this.rerender();
  }

  async onSubmit() {
      const sourceData = { type: this.selectedSource };
    if (this.selectedSource === "emc_membership") {
      sourceData.member_number =  this.getEl("activateProductsMemberNumber").value;
      sourceData.card_number = this.getEl("activateProductsCardNumber").value;
    } else if (this.selectedSource === "carbonify_thg") {
      sourceData.email = this.getEl("activateProductsCarbonifyEmail").value;
      sourceData.country = this.getEl("activateProductsCarbonifyCountry").value;
      sourceData.quota_year = parseInt(this.getEl("activateProductsCarbonifyQuotaYear").value);
    }

    this.error = null;

    try {
      await this.userProducts.activate(sourceData);
      const source = SOURCES.find(s => s.value === this.selectedSource);
      this.activatedProducts = source ? source.products : [];
      this.success = true;
      this.rerender();
    } catch (err) {
      if (err.code === "PRODUCT_SOURCE_NOT_FOUND") {
        this.error = this.t("activateProductsErrorNotFound");
      } else if (err.code === "PRODUCT_SOURCE_ALREADY_USED") {
        this.error = this.t("activateProductsErrorAlreadyUsed");
      } else {
        this.error = this.t("activateProductsErrorGeneric");
      }
      this.rerender();
    }
  }
}
