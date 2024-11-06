export default class MapPinsV2 {
  
  constructor(){
    this.priceIconWidth = 32;
    this.priceIconHeight = 24;
    this.acColor = "#3498dc";
    this.dcColor = "#226ba1";
    this.hpcColor = "#0f3854";
  }

  buildHtml(model, countBadge, isBest, cheapestPrice, color, price){

    const highestPower = this.highestPower(model);
    const mainValue = price ? (price / 42.0).toFixed(2) : highestPower;
    const unit = price ? "EUR" : "kW";
    const pinFile = price ? this.pinForPrice(price, cheapestPrice) : this.pinForPower(highestPower);

    let html = `<div class="cp-map-poi-marker cp-map-poi-marker-v5">
      <div class="price">
        <span class="value">${mainValue}</span>
        <span class="unit w3-block">${unit}</span>
      </div>
      ${price ? `<div class="power-badge" style="background: ${this.colorForPower(highestPower)};">${highestPower} <span style="font-size: 0.8em">kW</span></div>` : ""}
      ${countBadge ? `<div class="count-badge">${countBadge}</div>` : ""}
      <img class="pin" src="img/markers/V2/${pinFile}.svg?t=1" />
    </div>`;

    return {
      html: html,
      width: 32,
      height: 24
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