var dayjs = require('dayjs');
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';
export default class ViewBase {

  constructor(depts) {
    this.depts=depts;
    this.customConfig = depts.customConfig();
    this.translation = depts.translation(); 
  }

  getSelectedValue(id){
    return document.getElementById(id).selectedOptions[0].value;
  }

  isChecked(id){
    if(this.getEl(id)==null)return false;
    return this.getEl(id).checked;
  }

  setChecked(id,value){
    if(this.getEl(id)==null)return;
    this.getEl(id).checked = value;
  }

  ut(key){
    return unsafeHTML(this.translation.get(key));
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

  show(id){
    this.getEl(id).style.display = 'block';
  }

  hide(id){
    this.getEl(id).style.display = 'none';
  }

  toggle(id, isShown){
    isShown ? this.show(id) : this.hide(id);
  }

  h(){
    return {
      dec: (val,digits=2) => val!=null ? val.toFixed(digits) : "-",
      perc: val => `${(val*100).toFixed(0)}%`,
      int: val=>val.toFixed(0),
      power: val => val >= 10 ? val.toFixed(0) : val.toFixed(1),
      time: val => {
        const h = Math.floor(val / 60);
        const min = Math.ceil(val % 60);
        if(h==0 && min > 0) return `${min}min`;
        else if(h>0 && min == 0)return `${h}h`;
        else return this.translation.stringFormatWithKey("timeFormat",h,min);
      },
      timeOfDay: time => {
        if(time == null) return "";
        const hours = parseInt(time / 60);
        const minutes = time % 60;
        return dayjs(new Date().setHours(hours,minutes)).format("HH:mm");
      },
      upper: val => val.toUpperCase(),
      customConfig: this.customConfig
    }
  }
}