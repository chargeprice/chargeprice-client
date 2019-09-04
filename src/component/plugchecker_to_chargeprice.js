require('jsrender')($);

export default class PlugcheckerToChargeprice {
  constructor(translation){
    this.translation = translation;
    $("#messageDialogOk").click(()=>this.hideDialog());
  }

  isPlugchecker(){
    return window.location.host == "www.plugchecker.com";
  }

  didShowDialog(){
    return localStorage.getItem("didShowPlugcheckerToChargeprice");
  }

  tryShowDialog(){
    if(!this.isPlugchecker() || this.didShowDialog()) return;

    $("#messageDialogHeader").html(this.translation.get("plugcheckerToChargepriceHeader"))
    $("#messageDialogContent").html(this.translation.get("plugcheckerToChargepriceContent"))
    $("#messageDialogOk").html(this.translation.get("plugcheckerToChargepriceBtn"))

    $("#messageDialog").show();
  }

  hideDialog(){
    $("#messageDialog").hide();
    localStorage.setItem("didShowPlugcheckerToChargeprice","true");
    window.location = "https://www.chargeprice.app"
  }
}

