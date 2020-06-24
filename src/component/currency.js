import {html, render} from 'lit-html';
import GenericList from '../modal/genericList';

export default class Currency {
  constructor(sidebar,depts) {
    this.sidebar = sidebar;
    this.depts = depts;
    this.translation = depts.translation();
    this.currencies = ["EUR","CHF","CZK","DKK","GBP","HUF","ISK","PLN","SEK","NOK","HRK"].sort();
    this.defaultCurrency = "EUR";
    this.settingsKey = "displayedCurrency"
    this.selectedCurrency = this.defaultCurrency;
    this.initCurrencies();
  }

  template(){
    return html`
      <span @click="${()=>this.changeCurrency()}" class="w3-button w3-light-gray">
        ${this.selectedCurrency}
      </span>
    `;
  }

  renderTemplate(){
    render(this.template(),document.getElementById("selectCurrency"));
  }

  initCurrencies(){
    if(localStorage.getItem(this.settingsKey)){
      this.selectedCurrency = localStorage.getItem(this.settingsKey);
    }
    this.renderTemplate();
    this.currencyChanged(this.selectedCurrency);
  }

  currencyChanged(value){
    this.selectedCurrency = value;
    localStorage.setItem(this.settingsKey,this.selectedCurrency);
    this.sidebar.optionsChanged();
    this.renderTemplate();
    $("#pricesListCurrencyHeader").html(this.selectedCurrency);
  }

  changeCurrency(){
    new GenericList(this.depts).show(
      {
        items: this.currencies,
        header: this.translation.get("displayedCurrencyHeader"), 
        convert: i => i,
        narrow: true
      },(c)=>this.currencyChanged(c));
  }

  getDisplayedCurrency(){
    return this.selectedCurrency;
  }
}