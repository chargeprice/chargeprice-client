import {html, render} from 'lit-html';
import ModalBase from './base';
import StationTariffs from '../repository/station_tariffs'

export default class ModalFeedback extends ModalBase {
  constructor(depts){
    super(depts);
    this.analytics = depts.analytics();
    this.customConfig = depts.customConfig();
  }

  generalTemplate(header,customTemplate, notesHeader){
    return html`
    <div class="w3-modal-content">
      ${this.header(header)}
      <div class="w3-container w3-padding">
        ${customTemplate}
        <p>
          ${ notesHeader ? html`<label>${this.t("fbNotesHeader")}</label>` : "" }
          <textarea id="notes" value="" maxlength="1000" placeholder="${this.t("fbNotesPlaceholder")}" class="w3-input w3-border"></textarea>
        </p>
        <p>
          <label>${this.t("fbEmailHeader")}*</label>
          <input id="email" value="" maxlength="100" placeholder="my.email@gmail.com" class="w3-input w3-border"/>
        </p>
        <p>
        ${this.t("fbEmailFooter")} <a href="mailto:contact@chargeprice.net">contact@chargeprice.net</a>
        </p>
      </div>
      <button @click="${()=>this.submit()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
        ${this.t("fbSubmit")}
      </button>
      <button @click="${()=>this.hide()}" class="w3-btn w3-light-gray w3-margin-bottom w3-margin-left">
        ${this.t("cancel")}
      </button>
    </div>
    `
  }

  missingStationTemplate(){
    return html`
    ${ this.translation.currentLocale == "de" ? html`
      <p>
        <strong class="w3-large">
          ${this.ut("fbLocationGEInfo")}
        </strong>
      </p>
      `:""
      }
      <p>
        <img src="${this.staticMapWithMarkerLink()}" style="max-width: 100%;"/>
      </p>
      <p>
        <label>${this.t("fbLocationHeader")}</label>
        <input id="location" value="" maxlength="200" placeholder="${this.t("fbLocationPlaceholder")}" class="w3-input w3-border"/>
      </p>
      <p>
        <label>${this.t("fbCpoHeader")}</label>
        <input id="cpo" value="" maxlength="100" placeholder="${this.t("fbExample")} IONITY" class="w3-input w3-border"/>
      </p>
    `
  }

  missingVehicleTemplate(){
    return html`
      <p>
        <label>${this.t("fbBrandHeader")}</label>
        <input id="brand" value="" maxlength="100" placeholder="${this.t("fbExample")} Tesla" class="w3-input w3-border"/>
      </p>
      <p>
        <label>${this.t("fbModelHeader")}</label>
        <input id="model" value="" maxlength="100" placeholder="${this.t("fbExample")} Model 3 LR+" class="w3-input w3-border"/>
      </p>
    `
  }

  missingPriceTemplate(options){
    return html`
      <p>
        <label>${this.t("fbCpoHeader")}: ${options.cpo}</label>
      </p>
      <p>
        <label>${this.t("fbEmpHeader")}</label>
        <input id="tariff" value="" maxlength="100" placeholder="${this.t("fbExample")} Plugsurfing" class="w3-input w3-border"/>
      </p>
      <p>
        <label>${this.t("fbPriceHeader")}</label>
        <input id="price" value="" maxlength="100" placeholder="${this.t("fbPricePlaceholder")}" class="w3-input w3-border"/>
      </p>
    `
  }

  wrongPriceTemplate(options){
    return html`
      <p>
        <label>${this.t("fbEmpHeader")}</label>
        <select id="feedbackTariffList" class="w3-select">
          ${options.prices.map((p,idx)=>
            html`<option value="${idx}">${p.tariff.provider} ${p.tariff.tariffName} ${p.tariff.providerCustomerTariff ? ` (${this.t("providerCustomerOnly")})` : ""}: ${this.h().dec(p.price)}</option>`)
          }
        </select>
      </p>
      <p>
        <label>${this.t("fbActualPriceHeader")}</label>
        <input id="price" value="" maxlength="100" placeholder="${this.t("fbActualPricePlaceholder")}" class="w3-input w3-border"/>
      </p>
    `
  }

  submittedTemplate(){
    return html`
      <div class="w3-modal-content">
        ${this.header(this.t("fbThankYouHeader"))}
        <div class="w3-container w3-padding">
        <label>${this.ut("fbThankYouText")}</label>
        </div>
        <button @click="${()=>this.hide()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
          ${this.t("close")}
        </button>
      </div>
    `
  }

  // options: 
  // - missing_price,wrong_price=cpo,poiLink,context,prices
  // - missing_station=location
  show(type,options){
    this.type = type;
    this.options = options;
    let template = null;
    let header = null;
    let notesHeader = false;
    switch(type){
      case "other_feedback":
        template = "";
        header = this.t("fbReportOtherHeader")
        break;
      case "missing_station":
        template = this.missingStationTemplate();
        header = this.t("fbReportMissingStationHeader")
        notesHeader = true;
        break;
      case "missing_vehicle":
        template = this.missingVehicleTemplate();
        header = this.t("fbReportMissingVehicleHeader")
        notesHeader = true;
        break;
      case "missing_price":
        template = this.missingPriceTemplate(options);
        header = this.t("fbReportMissingPriceHeader")
        notesHeader = true;
        break;
      case "wrong_price":
        template = this.wrongPriceTemplate(options);
        header = this.t("fbReportWrongPriceHeader")
        notesHeader = true;
        break;
    }
    render(this.generalTemplate(header, template, notesHeader),this.getEl(this.root));
    this.getEl(this.root).style.display = 'block';
  }

  async submit(){
    const feedback = {
      type: this.type,
      email: this.getEl("email").value,
      context: this.buildContext(),
      notes: this.getEl("notes").value,
      language: this.translation.currentLocaleOrFallback()
    }

    if(feedback.email == "" || feedback.email.indexOf("@") == -1) {
      alert(this.t("fbEmailHeader"));
      return;
    }

    switch(this.type){
      case "other_feedback":
        break;
      case "missing_station":
        feedback.location = this.getEl("location").value;
        feedback.cpo = this.getEl("cpo").value;
        feedback.context = `Longitude: ${this.options.location.longitude.toFixed(8)}, Latitude: ${this.options.location.latitude.toFixed(8)}` + feedback.context;
        break;
      case "missing_vehicle":
        feedback.brand = this.getEl("brand").value;
        feedback.model = this.getEl("model").value;
        break;
      case "missing_price":
        feedback.tariff = this.getEl("tariff").value;
        feedback.price = this.getEl("price").value;
        feedback.cpo = this.options.cpo || "n/a";
        feedback.poiLink = this.options.poiLink;
        feedback.context = feedback.context + ", " + this.options.context;
        break;
      case "wrong_price":
        const selectecIndex = this.getSelectedValue("feedbackTariffList")
        const price = this.options.prices[selectecIndex];
        feedback.tariff = `${price.tariff.provider} ${price.tariff.tariffName} ${price.providerCustomerTariff ? "(PC)" : ""}`;
        feedback.displayedPrice = this.h().dec(price.price);
        feedback.actualPrice = this.getEl("price").value;
        feedback.cpo = this.options.cpo;
        feedback.poiLink = this.options.poiLink;
        feedback.context = feedback.context + ", " + this.options.context;
        break;
    }

    this.analytics.log('send', 'event', 'UserReport', this.type);

    try {
      await new StationTariffs(this.depts).postUserFeedback(feedback);
      render(this.submittedTemplate(),this.getEl(this.root));
    }
    catch(ex){
      alert("An error occured");
    }
  }

  staticMapWithMarkerLink(){
    return `https://maps.locationiq.com/v3/staticmap?key=${process.env.LOCATION_IQ_KEY}&size=500x200&zoom=14&markers=${this.options.location.latitude},${this.options.location.longitude}|icon:small-red-cutout&format=png&zoom=17`
  }

  buildContext(){
    return [
      `iOS: ${this.customConfig.isIOS()}`,
      `beta: ${this.customConfig.isBeta()}`,
      `mobile: ${this.customConfig.isMobileOrTablet()}`,
      `app: ${this.customConfig.isRunningStandalone()}`,
      `host: ${window.location.hostname}`
    ].join(", ");
  }

}

