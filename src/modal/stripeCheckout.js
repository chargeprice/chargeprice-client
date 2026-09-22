import { html, render } from 'lit-html';
import ModalBase from './base';

const FEATURE_KEYS = [
  "stripeCheckoutFeature1",
  "stripeCheckoutFeature2",
  "stripeCheckoutFeature3"
];

const MONTHLY_PRICE = 2.99;
const YEARLY_PRICE = 29.99;
const YEARLY_PRICE_PER_MONTH = Math.round((YEARLY_PRICE / 12) * 100) / 100;
const YEARLY_SAVINGS_PERCENT = Math.round((1 - (YEARLY_PRICE / 12) / MONTHLY_PRICE) * 100);

function formatPrice(value) {
  return `${value.toFixed(2)} €`;
}

export default class ModalStripeCheckout extends ModalBase {
  constructor(depts) {
    super(depts);
    this.stripe = depts.stripe();
    this.billingCycle = "yearly";
    this.loading = false;
    this.error = null;
  }

  show(profile, accessToken) {
    this.profile = profile;
    this.accessToken = accessToken;
    this.billingCycle = "yearly";
    this.loading = false;
    this.error = null;
    super.show();
  }

  rerender() {
    render(this.template(), this.getEl(this.root));
  }

  template() {
    return html`
      <div class="w3-modal-content w3-animate-top" style="max-width:420px;">
        ${this.header(this.t("stripeCheckoutHeader"))}
        <div class="w3-container w3-padding w3-center">
          <i class="fa fa-star" style="font-size:2.4rem;color:#f5a623;"></i>
          <p class="pc-main-text header-font" style="font-size:1.3em;font-weight:600;margin:8px 0 2px;">
            ${this.t("stripeCheckoutTagline")}
          </p>
          <p class="w3-small w3-text-dark-gray" style="margin-top:0;">
            ${this.t("stripeCheckoutSubtext")}
          </p>

          <ul style="list-style:none;padding:0;margin:16px 0;text-align:left;">
            ${FEATURE_KEYS.map(key => html`
              <li style="display:flex;align-items:center;gap:10px;padding:6px 0;">
                <i class="fa fa-check-circle pc-main-text" style="font-size:1.1em;"></i>
                <span>${this.t(key)}</span>
              </li>
            `)}
          </ul>

          <div class="w3-row" style="border-radius:8px;overflow:hidden;border:1px solid #ddd;margin-bottom:16px;">
            <div
              class="w3-half w3-padding cp-billing-option ${this.billingCycle === "monthly" ? "pc-secondary" : ""}"
              style="cursor:pointer;text-align:center;"
              @click="${() => this.selectBillingCycle("monthly")}"
            >
              <div style="font-weight:600;">${this.t("stripeCheckoutMonthly")}</div>
              <div style="font-size:1.2em;font-weight:700;margin-top:4px;">${formatPrice(MONTHLY_PRICE)}</div>
              <div class="w3-small">${this.t("stripeCheckoutPerMonth")}</div>
            </div>
            <div
              class="w3-half w3-padding cp-billing-option ${this.billingCycle === "yearly" ? "pc-secondary" : ""}"
              style="cursor:pointer;text-align:center;position:relative;"
              @click="${() => this.selectBillingCycle("yearly")}"
            >
              <span
                class="w3-small w3-round"
                style="position:absolute;top:6px;right:6px;background:#f5a623;color:#fff;padding:1px 6px;font-weight:600;"
              >
                ${this.sf(this.t("stripeCheckoutSavings"), YEARLY_SAVINGS_PERCENT)}
              </span>
              <div style="font-weight:600;">${this.t("stripeCheckoutYearly")}</div>
              <div style="font-size:1.2em;font-weight:700;margin-top:4px;">${formatPrice(YEARLY_PRICE)}</div>
              <div class="w3-small">${this.sf(this.t("stripeCheckoutYearlyEquivalent"), formatPrice(YEARLY_PRICE_PER_MONTH))}</div>
            </div>
          </div>

          ${this.error ? html`<p class="w3-text-red w3-small">${this.error}</p>` : ""}

          <button
            @click="${() => this.onContinue()}"
            ?disabled="${this.loading}"
            class="w3-btn pc-secondary w3-block w3-padding"
          >
            ${this.loading ? html`<i class="fa fa-spinner fa-spin"></i>` : this.t("stripeCheckoutContinue")}
          </button>
        </div>
      </div>
    `;
  }

  selectBillingCycle(cycle) {
    this.billingCycle = cycle;
    this.error = null;
    this.rerender();
  }

  async onContinue() {
    this.loading = true;
    this.error = null;
    this.rerender();

    try {
      const url = await this.stripe.createCheckoutSession(this.profile.userId, this.accessToken, "mobile_premium", this.billingCycle);
      window.location.href = url;
    } catch (error) {
      this.loading = false;
      this.error = this.t("stripeCheckoutError");
      this.rerender();
    }
  }
}
