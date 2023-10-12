import 'regenerator-runtime/runtime'
import Subject from '../../src/helper/priceCsvSerializer'

test('with prices',async () => {
  const station = {
    latitude: 12.345,
    longitude: 67.890,
    network: "IONITY"
  };

  const options = {
    chargePointEnergy: 50,
    chargePointDuration: 30.5
  };

  const priceList = [
    {
      tariff: { 
        id: 1,
        tariffName: "Mobility+ Small",
        provider: "EnBW",
        totalMonthlyFee: 5.99,
        currency: "EUR"
      },
      price: 14.89,
      distribution: {
        kwh: 0.4,
        minute: 0.5,
        session: 0.1
      },
      blockingFeeStart: 30
    }
  ];

  const expectedResult = "Charging Duration (Minutes),Charged Energy (kWh),Station Latitude,Station Longitude,Station Operator Name,Tariff Name,Tariff Provider Name,Tariff ID,Monthly Fee,Currency,Total Price,kWh-based Price Share,Time-based Price Share,Session Fee,Blocking Fee Start (Minutes)\n"+
  "30.5,50,12.345,67.89,IONITY,Mobility+ Small,EnBW,1,5.99,EUR,14.89,5.96,7.45,1.49,30"

  const subject = await new Subject(priceList, station, options).serialize(); 
  expect(subject).toEqual(expectedResult);
});