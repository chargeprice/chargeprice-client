export default class MapPinsV2 {
  
  constructor(){
    this.priceIconWidth = 40;
    this.priceIconHeight = 30;
    this.acColor = "#c2e3fd";
    this.dcColor = "#0497ff";
    this.hpcColor = "#006cb8";

    // green: 51c571ff
    // orange: ff9d6dff
    // red: eb7881ff

  }

  buildHtml(model, countBadge, isBest, cheapestPrice, color, price){

    const highestPower = this.highestPower(model);
    const mainValue = price ? (price / 42.0).toFixed(2) : highestPower;
    const unit = price ? "EUR" : "kW";
    const pinFile = price ? this.pinForPrice(price, cheapestPrice) : this.pinForPower(highestPower);
    const mainTextColor = price ? "#fff" : this.textColorForPower(highestPower);

    let html = `<div class="cp-map-poi-marker cp-map-poi-marker-v2">
      <div class="price" style="color: ${mainTextColor};">
        <span class="value">${mainValue}</span>
        <span class="unit w3-block">${unit}</span>
      </div>
      ${price ? `<div class="power-badge" style="background: ${this.colorForPower(highestPower)}; color: ${this.textColorForPower(highestPower)};">${highestPower}<span style="font-size: 0.8em"> kW</span></div>` : ""}
      ${countBadge ? `<div class="count-badge">${countBadge}</div>` : ""}
      <img class="pin" src="img/markers/V4/${pinFile}.svg?t=21" />
    </div>`;

    return {
      html: html,
      width: this.priceIconWidth,
      height: this.priceIconHeight
    }
  }

  highestPower(model){
    return model.chargePoints.reduce((memo,cp)=>cp.power > memo ? cp.power : memo,0);
  }

  colorForPower(power){
    if(power <= 22) return this.acColor;
    if(power < 150) return this.dcColor;
    return this.hpcColor;
  }

  colorForPrice(price, cheapestPrice){
    if(price <= cheapestPrice * 1.1) return "#19a673";
    if(price <= cheapestPrice * 1.25) return "#ff8127";
    return "#f74a56";
  }

  textColorForPower(power){
    if(power <= 22) return "#000";
    if(power < 150) return "#fff";
    return "#fff";
  }

  pinForPower(power){
    if(power <= 22) return "pin";
    if(power < 150) return "pin_dc";
    return "pin_hpc";
  }

  pinForPrice(price, cheapestPrice){
    if(price <= cheapestPrice * 1.1) return "pin_green";
    if(price <= cheapestPrice * 1.25) return "pin_orange";
    return "pin_red";
  }

}