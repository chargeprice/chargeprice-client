require('jsrender')($);

import StationTariffs from '../repository/station_tariffs.js';

export default class ManageMyTariffs {
  constructor(sidebar,analytics) {
    this.sidebar = sidebar;
    this.analytics = analytics;
    this.allTariffs = [];
    this.myTariffIds = [];
    this.loadAllTariffs();
    this.loadFromStorage();
  }

  async loadAllTariffs(){
    this.allTariffs = (await new StationTariffs().getAllTariffs()).data;
  }

  loadFromStorage(){
    this.myTariffIds = JSON.parse(localStorage.getItem("myTariffIds")) || [];  
  }

  async initMyTariffs(){
    const sortedTariffs = this.allTariffs.sort((a,b)=>a.provider.localeCompare(b.provider));

    $("#manageMyTariffsContent").html($.templates("#manageMyTariffsTempl").render({ tariffs: sortedTariffs }));

    this.myTariffIds.forEach(id=>$(`#charge-card-list #${id}`).prop('checked', true)); 
    
    $("#manage-cards-back").click(()=>{
      this.sidebar.open("settings");
      this.saveToStorage();
      this.sidebar.optionsChanged();
    });
  }

  saveToStorage(){
    this.myTariffIds = [];
    $("#charge-card-list input[name='tariff']:checked").each((idx,obj) => {
      this.myTariffIds.push(obj.id);
    });

    localStorage.setItem("myTariffIds",JSON.stringify(this.myTariffIds));
    this.analytics.log('send', 'event', 'MyTariffs', 'save',null,this.myTariffIds.length);
  }

  getMyTariffs(){
    return this.allTariffs.filter(t=>this.myTariffIds.includes(t.id));
  }
}