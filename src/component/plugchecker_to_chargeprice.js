export default class PlugcheckerToChargeprice {
  constructor(depts){
    this.translation = depts.translation();
    $("#messageDialogOk").click(()=>this.hideDialog());
  }

  isPlugchecker(){
    return window.location.host == "www.plugchecker.com" ||
      window.location.host == "laden.isvoi.org";
  }

  didShowDialog(){
    return localStorage.getItem("didShowPlugcheckerToChargeprice");
  }

  tryShowDialog(){
    if(!this.isPlugchecker()) return false;

    $("#messageDialogHeader").html(this.translation.get("plugcheckerToChargepriceHeader"))
    $("#messageDialogContent").html(this.translation.get("plugcheckerToChargepriceContent"))
    $("#messageDialogOk").html(this.translation.get("plugcheckerToChargepriceBtn"))

    $("#messageDialog").show();

    return true;
  }

  hideDialog(){
    $("#messageDialog").hide();
    localStorage.setItem("didShowPlugcheckerToChargeprice","true");
    window.location = "https://www.chargeprice.app"
  }
}

