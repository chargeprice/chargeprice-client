require('jsrender')($);

export default class Currency {
  constructor(sidebar) {
    this.sidebar = sidebar;
    this.currencies = ["EUR","CHF","CZK","DKK","GBP","HUF","ISK","PLN","SEK","NOK","HRK"];
    this.defaultCurrency = "EUR";
    this.settingsKey = "displayedCurrency"
    this.selectedCurrency = this.defaultCurrency;
    this.registerTemplates();
    this.initCurrencies();
  }

  registerTemplates(){
    $.templates("currencyTempl",`
      {{for currencies}}
        <option value="{{:iso}}" {{if selected}}selected{{/if}}>{{:iso}}</option>
      {{/for}}
    `);
  }

  initCurrencies(){
    if(localStorage.getItem(this.settingsKey)){
      this.selectedCurrency = localStorage.getItem(this.settingsKey);
    }

    const uiCurrencies = this.currencies.map(c=>new Object({iso: c, selected: this.selectedCurrency == c}));
    $("#selectCurrency").html($.render.currencyTempl({ currencies: uiCurrencies }));
    $("#selectCurrency").on('change', ()=>this.currencyChanged());

    this.currencyChanged();
  }

  currencyChanged(){
    this.selectedCurrency = $("#selectCurrency").val();
    localStorage.setItem(this.settingsKey,this.selectedCurrency);
    this.sidebar.optionsChanged();
    $("#pricesListCurrencyHeader").html(this.selectedCurrency);
  }

  getDisplayedCurrency(){
    return this.selectedCurrency;
  }
}