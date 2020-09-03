import { html, render } from 'lit-html';
import ViewBase from '../component/viewBase';
export default class PriceListView extends ViewBase {
  template(prices){
    return prices.map(p=>{
      const tariff = p.tariff;
      return html`
      <tr style="${p.featuring ? `background: ${p.featuring.backgroundColor} !important;` : ""}" >
        <td class="cp-price-left">
          ${tariff.tariffName == null || tariff.tariffName == tariff.provider ?
            html`<a class="affiliateLinkEMP" href="${tariff.url}" target="_blank"><span>${tariff.provider}</span></a>` :
            html`<a class="affiliateLinkEMP" href="${tariff.url}" target="_blank"><span>${tariff.tariffName}</span></a><br>
                 ${!p.featuring ? html`<label class="w3-margin-top w3-small">${tariff.provider}</label>`:""}`
          }
          ${this.renderTags(p.tariff.tags)}
          ${tariff.totalMonthlyFee > 0 || tariff.monthlyMinSales > 0 ?
            html`
              <br>
              <label class="w3-margin-top w3-small">
              ${tariff.totalMonthlyFee > 0 ? `${this.t("baseFee")}: ${this.h().dec(tariff.totalMonthlyFee)}/${this.t("month")}**`:"" }
              ${tariff.monthlyMinSales > 0 ? `${this.t("minSales")}:${this.h().dec(tariff.monthlyMinSales)}/${this.t("month")}`:"" }
              </label>
            `:""}
          ${tariff.providerCustomerTariff ?
            html`
              <br>
              <label class="w3-margin-top w3-small">${this.t("providerCustomerOnly")}</label> 
            `:""}
          ${p.featuring ? html`
            <a href="${tariff.url}" target="_blank"><img class="feature-logo" src="${p.featuring.logoUrl}"/></a>
          `:""}
          ${this.h().customConfig.isBeta() && tariff.links && tariff.links.open_app_at_station ?
            html`<br>
            <a href="${tariff.links.open_app_at_station}" class="w3-button w3-small w3-blue" target="_blank"><i class="fa fa-bolt"></i> Start Charging!</a> 
            `:""}
        </td>
        <td class="cp-price-right">
          <label class="w3-right">${this.h().dec(p.price)}</label><br>
          ${p.price > 0 ?
            html`<label class="w3-right w3-small">${this.t("average")} ${this.h().dec(p.pricePerKWh)}/kWh</label><br>`:""
          }
          <label class="w3-right w3-small">
            ${p.distribution.session ? `${(p.distribution.session < 1 ? this.h().perc(p.distribution.session) : "")} ${this.t("session")}` : ""}
            ${p.distribution.minute ? html`${(p.distribution.minute < 1 ? this.h().perc(p.distribution.minute) : "")} ${this.t("per")} <i class="fa fa-clock-o"></i>` : ""}
            ${p.distribution.kwh ? `${(p.distribution.kwh < 1 ? this.h().perc(p.distribution.kwh) : "")} ${this.t("per")} kWh` : ""}
          </label>
        </td>
      </tr>
    `});
  }

  renderTags(tags){
    const colorMapping = {
      alert: "w3-deep-orange",
      info: "pc-main",
      star: "w3-green",
      lock: "w3-dark-gray"
    }
    const iconMapping = {
      alert: "exclamation",
      info: "info",
      star: "star",
      lock: "lock"
    }
    return tags.map(tag=>
      html`
        <span class="${ `w3-tag w3-small cp-margin-top-right-small ${colorMapping[tag.kind]}`}"><label><i class="${`fa fa-${iconMapping[tag.kind]}`}"></i> 
          ${tag.url ? html`<a href="${tag.url.replace("{locale}",this.translation.currentLocaleOrFallback())}" target="_blank">${tag.text}</a>` : tag.text}
        </label>
    `);
  }

  render(prices,root){
    render(this.template(prices),this.getEl(root));
  }
}

