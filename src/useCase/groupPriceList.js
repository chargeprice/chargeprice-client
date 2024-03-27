
export default class GroupPriceList {
  constructor(depts, prices, myTariffs, allowedPromotedTariffIds){
    this.depts=depts;
    this.prices = prices;
    this.myTariffs = myTariffs;
    this.allowedPromotedTariffIds = allowedPromotedTariffIds;
  }

  run(){
    const myPrices = this.prices.filter(p=>this.isMyTariff(p.tariff));
    const otherPrices = this.prices.filter(p=>!this.isMyTariff(p.tariff));
    const promoted = this.prices.filter(p=>this.isHighlighted(p.tariff));

    return {
      allPrices: this.prices,
      allMyPrices: myPrices,
      allOtherPrices: otherPrices,
      promoted: promoted,
    }
  }

  isHighlighted(tariff) {
    return tariff.branding && 
      (!this.allowedPromotedTariffIds || this.allowedPromotedTariffIds.includes(tariff.tariff.id));
  }

  isMyTariff(tariff){
    return this.myTariffs.some(t=>t.id == tariff.tariff.id); 
  }
}