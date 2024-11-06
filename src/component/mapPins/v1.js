export default class MapPinsV1 {
  
  constructor(){
    this.iconWidth = 24;
    this.iconHeight = 30;
    this.priceIconWidth = 32;
    this.priceIconHeight = 24;
  }

  buildHtml(model, countBadge, isBest, cheapestPrice, color, price){
    let html = `<div class="cp-map-poi-marker">
      ${price ? `<div class="price ${model.branding? "promoted":""}">${price}</div>` : ""}
      ${!price && model.branding ? `<div class="promotion"><img src="${model.branding.map_pin_icon_url}"/></div>` : ""}
      ${isBest ? `<div class="best-price-badge"><i class="fa fa-star"></i></div>` : ""}
      ${countBadge ? `<div class="count-badge">${countBadge}</div>` : ""}
      <img class="pin" src="img/markers/V1/${color}${price || model.branding ? "_price" : ""}.svg?t=1" />
    </div>`;

    let width = (price || model.branding ? this.priceIconWidth : this.iconWidth );
    let height = (price || model.branding ? this.priceIconHeight : this.iconHeight );

    if(model.branding) {
      width*=1.2;
      height*=1.2;
    }

    return {
      html: html,
      width: width,
      height: height
    }
  }

}