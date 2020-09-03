import {html, render} from 'lit-html';
import ViewBase from '../component/viewBase';

export default class StartTimeSelection extends ViewBase {
  constructor(depts){
    super(depts);
    this.root = "messageDialog";
  }

  template(startTime){
    const hour = parseInt((startTime || 0) / 60);
    const minute = parseInt((startTime || 0) % 60);

    return html`
    <div class="w3-modal-content">
      <div class="w3-bar pc-secondary">
        <span class="w3-bar-item w3-large">${this.t("startTimeSelectionHeader")}</span>
      </div>
      <div class="w3-container w3-padding">
        <p>
          <input id="selectStartTimeUseCurrentTime" class="w3-radio" type="radio" name="startTime" ?checked="${startTime == null}">
          <label>${this.t("startTimeSelectionNow")}</label>
        <p>
          <input class="w3-radio" type="radio" name="startTime" ?checked="${startTime != null}">
          <label>${this.t("startTimeSelectionCustomTime")}</label>
          <div>
            <input id="selectStartTimeHour" class="w3-input w3-input-inline " value="${hour}" type="number" min="0" max="23"> : 
            <input id="selectStartTimeMinute" class="w3-input w3-input-inline " value="${minute}" type="number" min="0" max="59">
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
      const hour = parseInt(this.getEl("selectStartTimeHour").value);
      const minute = parseInt(this.getEl("selectStartTimeMinute").value);
      startTime = hour*60 + minute;
    }
    if(this.callback) this.callback(startTime);
  }

  hide(){
    this.getEl(this.root).style.display = 'none';
  }
}

