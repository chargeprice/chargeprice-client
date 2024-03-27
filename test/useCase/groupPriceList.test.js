import 'regenerator-runtime/runtime'
import Subject from '../../src/useCase/groupPriceList'


test('empty price list',async () => {
  const prices = [];
  const myTariffs = [];
  const allowedPromotedTariffIds = [];
  const expectedResult = {
    allPrices: [],
    allMyPrices: [],
    allOtherPrices: [],
    promoted: [],
  };

  const subject = await new Subject({},prices, myTariffs, allowedPromotedTariffIds).run(); 
  expect(subject).toEqual(expectedResult);
});


function buildTariff(id, monthlyFee=0, hasBranding=false){
  return {
    tariff: { 
      tariff: { id: id }, 
      totalMonthlyFee: monthlyFee, 
      branding: hasBranding
    }
  }
}

test('without prices in every group',async () => {

  const myPrice = buildTariff("1")
  const priceWithoutMonthlyFee1 = buildTariff("2");
  const priceWithMonthlyFee = buildTariff("3",1);
  const priceWithoutMonthlyFee2 = buildTariff("4",0,true);
  const priceWithoutMonthlyFee3 = buildTariff("5");

  const allowedPromotedTariff = buildTariff("6",0,true);
  const notAllowedPromotedTariff = buildTariff("7",0,true);

  const prices = [
    myPrice, priceWithoutMonthlyFee1, priceWithMonthlyFee, 
    priceWithoutMonthlyFee2, priceWithoutMonthlyFee3, 
    allowedPromotedTariff, notAllowedPromotedTariff 
  ];
  const myTariffs = [{id: "1"}];
  const allowedPromotedTariffIds = ["6"];
  const expectedResult = {
    allPrices: prices,
    allMyPrices: [myPrice],
    allOtherPrices: [
      priceWithoutMonthlyFee1, priceWithMonthlyFee, 
      priceWithoutMonthlyFee2, priceWithoutMonthlyFee3, 
      allowedPromotedTariff, notAllowedPromotedTariff 
    ],
    promoted: [allowedPromotedTariff]
  };

  const subject = await new Subject({},prices, myTariffs, allowedPromotedTariffIds).run(); 
  expect(subject).toEqual(expectedResult);
});