import {html, render} from 'lit-html';
import ViewBase from '../component/viewBase';

export default class StartTimeSelection extends ViewBase {
  constructor(translation){
    super(translation);
    this.root = "messageDialog";
  }

  template(startTime){
    const hour = parseInt((startTime || 0) / 60);
    const minute = parseInt((startTime || 0) % 60);

    return html`
    <div class="w3-modal-content">
      <div class="w3-bar pc-secondary w3-padding">
        <h3 id="messageDialogHeader">${this.t("startTimeSelectionHeader")}</h3>
      </div>
      <div id="messageDialogContent" class="w3-container w3-padding">
        <p>
          <input id="selectStartTimeUseCurrentTime" class="w3-radio" type="radio" name="startTime" ?checked="${startTime == null}">
          <label>${this.t("startTimeSelectionNow")}</label>
        <p>
          <input class="w3-radio" type="radio" name="startTime" ?checked="${startTime != null}">
          <label>${this.t("startTimeSelectionCustomTime")}</label>
          <div>
            <select id="selectStartTimeHour" class="w3-select w3-margin-right" style="width: 100px">
              ${[...new Array(24)].map((v,idx)=>html`<option value="${idx}" ?selected="${hour == idx}">${idx}</option>`)}
            </select>
            <select id="selectStartTimeMinute" class="w3-select" style="width: 100px">
              ${[...new Array(12)].map((v,idx)=>html`<option value="${idx*5}" ?selected="${minute == (idx*5)}">${idx*5}</option>`)}
            </select>
          </div>
        <p>
      </div>
      <button @click="${()=>this.save()}" class="w3-btn pc-secondary w3-margin-bottom w3-margin-left">${this.t("ok")}</button>
      <button @click="${()=>this.hide()}" class="w3-btn pc-secondary w3-margin-bottom">${this.t("cancel")}</button>
    </div>
    `
  }

  show(startTime, callback){
    this.callback = callback;
    render(this.template(startTime),this.getEl(this.root));
    this.getEl(this.root).style.display = 'block';
  }

  save(){
    this.hide();
    const useCurrentTime = this.getEl("selectStartTimeUseCurrentTime").checked;
    let startTime = null;

    if(!useCurrentTime){
      const hour = parseInt(this.getSelectedValue("selectStartTimeHour"));
      const minute = parseInt(this.getSelectedValue("selectStartTimeMinute"));
      startTime = hour*60 + minute;
    }
    
    if(this.callback) this.callback(startTime);
  }

  hide(){
    this.getEl(this.root).style.display = 'none';
  }
}

