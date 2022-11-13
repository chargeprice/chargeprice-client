
export default class GroupPriceList {
  constructor(depts, prices, myTariffs, allowedPromotedTariffIds, pricesPerGroup){
    this.depts=depts;
    this.prices = prices;
    this.myTariffs = myTariffs;
    this.pricesPerGroup = pricesPerGroup;
    this.allowedPromotedTariffIds = allowedPromotedTariffIds;
  }

  run(){
    const myPrices = this.prices.filter(p=>this.isMyTariff(p.tariff));
    const otherPrices = this.prices.filter(p=>!this.isMyTariff(p.tariff));
    
    const bestWithMonthlyFees = []
    const bestWithoutMonthlyFees = []
    const promoted = []

    otherPrices.forEach(price=>{
      const hasMonthlyFee = price.tariff.totalMonthlyFee > 0 || price.tariff.monthlyMinSales;
      if(bestWithMonthlyFees.length < this.pricesPerGroup && hasMonthlyFee){
        bestWithMonthlyFees.push(price);
      }
      else if(bestWithoutMonthlyFees.length < this.pricesPerGroup && !hasMonthlyFee){
        bestWithoutMonthlyFees.push(price);
      }
      else if(this.isHighlighted(price.tariff)) promoted.push(price);
    });

    const bestMyPrices = myPrices.slice(0,this.pricesPerGroup);

    return {
      allPrices: this.prices,
      allMyPrices: myPrices,
      allOtherPrices: otherPrices,
      bestMyPrices: bestMyPrices,
      bestWithoutMonthlyFees: bestWithoutMonthlyFees,
      bestWithMonthlyFees: bestWithMonthlyFees,
      promoted: promoted,
      morePricesCount: this.prices.length - (bestMyPrices.length + bestWithoutMonthlyFees.length + bestWithMonthlyFees.length + promoted.length)
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