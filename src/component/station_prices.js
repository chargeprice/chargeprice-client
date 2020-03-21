require('jsrender')($);

import ProviderFeaturing from './providerFeaturing';

export default class StationPrices {
  constructor(sidebar,analytics) {
    this.sidebar = sidebar;
    this.analytics = analytics;
    this.slider = null;
    this.defaultBatteryRange = [20,80];
    this.registerTemplates();
    this.initSlider();
  }

  registerTemplates(){
    $.templates({
      "batteryRangeInfoTempl":`
        {{:~sf(~t("batteryRangeInfo"),from,to)}}
      `,
      "parameterNoteTempl": `
        {{:~t("chargeDuration")}}: {{:~c("time",chargePointDuration)}},
        {{:~t("chargeEnergy")}}: {{:~c("int",chargePointEnergy)}} kWh, 
        {{:~t("average")}} {{:~c("dec", (chargePointEnergy*60/chargePointDuration))}} kW*
      `,
      "chargePointTempl": `
        <option value="{{:id}}" {{if !supportedByVehicle}}disabled{{/if}}>{{upper:plug}} {{:power}}kw ({{:count}}x)</option>
      `
    });
  }

  initSlider(){
    this.slider = document.getElementById('batteryRange');

    noUiSlider.create(this.slider, {
        start: this.getStoredOrDefaultBatteryRange(),
        step: 1,
        connect: true,
        range: { min: 0,max: 100 }
    });

    this.updateBatteryRangeInfo();
    this.slider.noUiSlider.on('update', ()=>this.updateBatteryRangeInfo());
    this.slider.noUiSlider.on('end', ()=>{
      this.storeBatteryRange();
      this.batteryChangedCallback()
    });
  }

  getBatteryRange(){
    return this.slider.noUiSlider.get().map(v=>parseInt(v));
  }

  updateBatteryRangeInfo(){
    const range = this.getBatteryRange();
    $("#batteryRangeInfo").html($.render.batteryRangeInfoTempl({from: range[0], to: range[1]}));
  }

  showStation(station,options){
    const sortedCP = station.chargePoints.sort((a,b)=>{
      const b1 = b.supportedByVehicle;
      const a1 = a.supportedByVehicle;

      if(b1 == a1) return (b.power-a.power);
      else return b1 - a1;
    });
    $("#select-charge-point").html($.render.chargePointTempl(sortedCP));   
  }
 
  updateStationPrice(station,prices,options){
    const sortedPrices = prices.sort((a,b)=>a.price - b.price);
    this.addFeaturings(sortedPrices);

    $("#priceList").html($.templates("#priceTempl").render(sortedPrices));
    $("#station-info").html($.templates("#stationTempl").render(station));
    $("#prices").toggle(!station.isFreeCharging && prices.length > 0 || prices.length > 0);
    $("#noPricesAvailable").toggle(!station.isFreeCharging && prices.length == 0);
    $("#parameterNote").html($.render.parameterNoteTempl(options));
    
    $(".affiliateLinkEMP").click((linkObject)=> this.analytics.log('send', 'event', 'AffiliateEMP', linkObject.currentTarget.href));
  }

  addFeaturings(prices){
    const featurings = new ProviderFeaturing().getFeaturedProviders();
    prices.forEach(p=>p.featuring = featurings[p.tariff.provider]);
  }

  onBatteryRangeChanged(callback){
    this.batteryChangedCallback = callback;
  }

  storeBatteryRange(){
    localStorage.setItem("batteryRange",JSON.stringify(this.getBatteryRange()));
  }

  getStoredOrDefaultBatteryRange(){
    if(localStorage.getItem("batteryRange")){
      return JSON.parse(localStorage.getItem("batteryRange"));
    }
    else return this.defaultBatteryRange;
  }

}