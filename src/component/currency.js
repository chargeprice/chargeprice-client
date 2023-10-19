export default class Currency {
  constructor(depts) {
    this.currencies = ["EUR","CHF","CZK","DKK","GBP","HUF","ISK","PLN","SEK","NOK","HRK"].sort();
    this.defaultCurrencyPerLanguage = {
      "da": "DKK"
    }
    this.defaultCurrency = "EUR";

    this.translation = depts.translation();
    this.settingsKey = "displayedCurrency"
    this.selectedCurrency = this.getDetaultCurrency();
    this.initCurrencies();
  }

  getDetaultCurrency(){
    const language = this.translation.currentLocaleOrFallback();

    return this.defaultCurrencyPerLanguage[language] || this.defaultCurrency;
  }

  initCurrencies(){
    if(localStorage.getItem(this.settingsKey)){
      this.selectedCurrency = localStorage.getItem(this.settingsKey);
    }
  }

  changeCurrency(value){
    this.selectedCurrency = value;
    localStorage.setItem(this.settingsKey,this.selectedCurrency);
  }

  getDisplayedCurrency(){
    return this.selectedCurrency;
  }
  
  getAvailableCurrencies(){
    return this.currencies;
  }
}