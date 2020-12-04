export default class Currency {
  constructor() {
    this.currencies = ["EUR","CHF","CZK","DKK","GBP","HUF","ISK","PLN","SEK","NOK","HRK"].sort();
    this.defaultCurrency = "EUR";
    this.settingsKey = "displayedCurrency"
    this.selectedCurrency = this.defaultCurrency;
    this.initCurrencies();
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