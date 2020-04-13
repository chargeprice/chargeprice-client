var dayjs = require('dayjs');

export default class ViewBase {

  constructor(translation) {
    this.translation = translation; 
  }

  getSelectedValue(id){
    return document.getElementById(id).selectedOptions[0].value;
  }

  t(key){
    return this.translation.get(key);
  }

  sf(source,...params){
    return this.translation.stringFormat(source,...params);
  }

  getEl(id){
    return document.getElementById(id);
  }

  h(){
    return {
      dec: (val,digits=2) => val.toFixed(digits),
      perc: val => `${(val*100).toFixed(0)}%`,
      int: val=>val.toFixed(0),
      power: val => val >= 10 ? val.toFixed(0) : val.toFixed(1),
      time: val => {
        const h = Math.floor(val / 60);
        const min = Math.floor(val % 60);
        return this.translation.stringFormatWithKey("timeFormat",h,min);
      },
      timeOfDay: time => {
        if(time == null) return "";
        const hours = parseInt(time / 60);
        const minutes = time % 60;
        return dayjs(new Date().setHours(hours,minutes)).format("HH:mm");
      },
      upper: val => val.toUpperCase()
    }
  }
}