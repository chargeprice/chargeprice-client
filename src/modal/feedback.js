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
          ${ notesHeader ? html`<label>Other details</label>` : "" }
          <textarea id="notes" value="" maxlength="1000" placeholder="Enter all details here!" class="w3-input w3-border"></textarea>
        </p>
        <p>
          <label>In case you want us to respond, please provide your e-mail</label>
          <input id="email" value="" maxlength="100" placeholder="my.email@gmail.com" class="w3-input w3-border"/>
        </p>
        <p>
          You can also reach out to us directly via e-mail: <a href="mailto:contact@chargeprice.net">contact@chargeprice.net</a>
        </p>
      </div>
      <button @click="${()=>this.submit()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
        Submit
      </button>
    </div>
    `
  }

  missingStationTemplate(){
    return html`
      <p>
        <label>Location of the Station</label>
        <input id="location" value="" maxlength="200" placeholder="e.g. Rue de Charge 12, Paris" class="w3-input w3-border"/>
      </p>
      <p>
        <label>Station Operator (CPO)</label>
        <input id="cpo" value="" maxlength="100" placeholder="e.g. IONITY" class="w3-input w3-border"/>
      </p>
    `
  }

  missingVehicleTemplate(){
    return html`
      <p>
        <label>Brand</label>
        <input id="brand" value="" maxlength="100" placeholder="e.g. Tesla" class="w3-input w3-border"/>
      </p>
      <p>
        <label>Model</label>
        <input id="model" value="" maxlength="100" placeholder="e.g. Model 3 LR+" class="w3-input w3-border"/>
      </p>
    `
  }

  missingPriceTemplate(options){
    return html`
      <p>
        <label>Station Operator: ${options.cpo}</label>
      </p>
      <p>
        <label>Provider and Tariff</label>
        <input id="tariff" value="" maxlength="100" placeholder="e.g. Plugsurfing" class="w3-input w3-border"/>
      </p>
      <p>
        <label>Price</label>
        <input id="price" value="" maxlength="100" placeholder="Price per kWh, minute etc." class="w3-input w3-border"/>
      </p>
    `
  }

  wrongPriceTemplate(options){
    return html`
      <p>
        <label>Station Operator: ${options.cpo}</label>
      </p>

      <p>
        <label>Provider and Tariff</label>
        <select id="feedbackTariffList" class="w3-select">
          ${options.prices.map((p,idx)=>
            html`<option value="${idx}">${p.tariff.provider} ${p.tariff.tariffName}: ${this.h().dec(p.price)}</option>`)
          }
        </select>
      </p>
      <p>
        <label>Actual Price</label>
        <input id="price" value="" maxlength="100" placeholder="Total Price or Price per kWh, minute etc." class="w3-input w3-border"/>
      </p>
    `
  }

  submittedTemplate(){
    return html`
      <div class="w3-modal-content">
        ${this.header("Thank you!")}
        <div class="w3-container w3-padding">
        <label>With your feedback you make this service more valueable for all others!</label>
        </div>
        <button @click="${()=>this.hide()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">
          Close
        </button>
      </div>
    `
  }

  // options: 
  // - missing_price,wrong_price=cpo,poiLink,context,prices
  show(type,options){
    this.type = type;
    this.options = options;
    let template = null;
    let header = null;
    let notesHeader = false;
    switch(type){
      case "other_feedback":
        template = "";
        header = "Feedback"
        break;
      case "missing_station":
        template = this.missingStationTemplate();
        header = "Report Missing Station"
        notesHeader = true;
        break;
      case "missing_vehicle":
        template = this.missingVehicleTemplate();
        header = "Report Missing Vehicle"
        notesHeader = true;
        break;
      case "missing_price":
        template = this.missingPriceTemplate(options);
        header = "Report Missing Price"
        notesHeader = true;
        break;
      case "wrong_price":
        template = this.wrongPriceTemplate(options);
        header = "Report Wrong Price"
        notesHeader = true;
        break;
    }
    render(this.generalTemplate(header, template, notesHeader),this.getEl(this.root));
    this.getEl(this.root).style.display = 'block';
  }

  async submit(){
    this.analytics.log('send', 'event', 'UserReport', this.type);

    const feedback = {
      type: this.type,
      email: this.getEl("email").value,
      context: this.buildContext(),
      notes: this.getEl("notes").value
    }

    switch(this.type){
      case "other_feedback":
        break;
      case "missing_station":
        feedback.location = this.getEl("location").value;
        feedback.cpo = this.getEl("cpo").value;
        break;
      case "missing_vehicle":
        feedback.brand = this.getEl("brand").value;
        feedback.model = this.getEl("model").value;
        break;
      case "missing_price":
        feedback.tariff = this.getEl("tariff").value;
        feedback.price = this.getEl("price").value;
        feedback.cpo = this.options.cpo;
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

    try {
      await new StationTariffs().postUserFeedback(feedback);
      render(this.submittedTemplate(),this.getEl(this.root));
    }
    catch(ex){
      alert("An error occured");
    }
  }

  buildContext(){
    return [
      `lang: ${this.translation.currentLocaleOrFallback()}`,
      `iOS: ${this.customConfig.isIOS()}`,
      `beta: ${this.customConfig.isBeta()}`,
      `mobile: ${this.customConfig.isMobileOrTablet()}`,
      `app: ${this.customConfig.isRunningStandalone()}`,
      `host: ${window.location.hostname}`
    ].join(", ");
  }

}

