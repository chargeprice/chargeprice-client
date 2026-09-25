export default class MapPinsV2 {
  
  constructor(){
    this.priceIconWidth = 33;
    this.priceIconHeight = 25;
    this.acColor = "#c2e3fd";
    this.dcColor = "#0497ff";
    this.hpcColor = "#006cb8";

    // green: #17a572
    // orange: #ff8228
    // red: #f74a56

    // Power Limits
    this.dcLimitLowerLimit = 50;
    this.hpcLimitLowerLimit = 150;
    
    // Price Classes
    this.priceClass2LowerLimit = 1.1;
    this.priceClass3LowerLimit = 1.25;

    this.baseZIndex = 500;
  }

  buildHtml(model, cheapestPrice, pricePreview){
    const countBadge = this.countBadgeValue(model);
    const highestPower = this.highestPower(model);
    const price = this.displayedPrice(pricePreview);
    const mainValue = price || highestPower;
    const unit = price ? pricePreview.currency : "kW";
    const pinFile = model.branding? "pin_gold" : (price ? this.pinForPrice(pricePreview.pricePerKWh, cheapestPrice) : this.pinForPower(highestPower));
    const mainTextColor = price ? "#fff" : this.textColorForPower(highestPower);

    let html = `<div class="cp-map-poi-marker cp-map-poi-marker-v2">
      ${!price && model.branding ? 
        `<div class="promotion" style="background-image: url('${model.branding.map_pin_icon_url}')"></div>` :
        `<div class="price" style="color: ${mainTextColor}; ${model.branding ? "top: 5px;" :""}">
          <span class="value">${mainValue}</span>
          <span class="unit w3-block">${unit}</span>
        </div>`
        }
      ${price || model.branding ? 
        `<div class="power-badge" style="background: ${this.colorForPower(highestPower)}; color: ${this.textColorForPower(highestPower)}; ${model.branding ? "width: 40px;" : "" }">
          ${highestPower}<span style="font-size: 0.8em"> kW</span>
        </div>` : ""}
      ${countBadge ? `<div class="count-badge">${countBadge}</div>` : ""}
      <img class="pin" src="img/markers/V5/${pinFile}.svg?t=1" />
    </div>`;

    const sizeFactor = model.branding ? 1.2 : 1;

    return {
      html: html,
      width: this.priceIconWidth * sizeFactor,
      height: this.priceIconHeight * sizeFactor,
      zIndex: this.baseZIndex + this.zIndex(model, highestPower, pricePreview, cheapestPrice)*100
    }
  }

  buildDotHtml(model){
    const highestPower = this.highestPower(model);
    const size = 12;

    const color = this.colorForPower(highestPower);
    // Light AC dots are hard to see on the map without a dark border
    const border = color == this.acColor ? "border-color: #000;" : "";

    const html = `<div class="cp-map-dot-marker-dot" style="background: ${color}; ${border}"></div>`;

    return {
      html: html,
      width: size,
      height: size,
      zIndex: this.baseZIndex + this.zIndex(model, highestPower, null, null)*100
    }
  }

  highestPower(model){
    return model.chargePoints.reduce((memo,cp)=>cp.power > memo ? cp.power : memo,0);
  }

  colorForPower(power){
    if(power < this.dcLimitLowerLimit) return this.acColor;
    else if(power < this.hpcLimitLowerLimit) return this.dcColor;
    else return this.hpcColor;
  }

  textColorForPower(power){
    if(power < this.dcLimitLowerLimit) return "#000";
    else if(power < this.hpcLimitLowerLimit) return "#fff";
    else return "#fff";
  }

  pinForPower(power){
    if(power < this.dcLimitLowerLimit) return "pin";
    else if(power < this.hpcLimitLowerLimit) return "pin_dc";
    return "pin_hpc";
  }

  pinForPrice(price, cheapestPrice){
    if(price <= cheapestPrice * 1.1) return "pin_green";
    else if(price <= cheapestPrice * 1.25) return "pin_orange";
    else return "pin_red";
  }

  countBadgeValue(model){
    const fastChargerCount = this.fastChargerCount(model);
    return fastChargerCount > 1 ? fastChargerCount : null;
  }

  zIndex(model, maxPower, pricePreview, cheapestPrice){
    if(model.branding) return 7;

    if(pricePreview){
      const price = pricePreview.pricePerKWh;
      if(price <= cheapestPrice * 1.1) return 6;
      else if(price <= cheapestPrice * 1.25) return 5;
      else return 4;
    }
    else {
      if(maxPower >= this.hpcLimitLowerLimit) return 3;
      else if(maxPower >= this.dcLimitLowerLimit) return 2;
      else return 1;
    }
  }

  displayedPrice(pricePreview){
    if(pricePreview == null) return null;
    const priceValue = pricePreview.pricePerKWh
    if(priceValue >= 100){
      return priceValue.toFixed(0);
    }
    else if(priceValue >= 10){
      return priceValue.toFixed(1);
    }
    else{
      return priceValue.toFixed(2);
    }
  }

  fastChargerCount(model){
    return model.chargePoints.reduce((sum,value)=> value.supportedByVehicle && value.power >= 50 ? sum + value.count : sum,0);
  }
}