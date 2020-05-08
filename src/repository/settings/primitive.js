
export default class RepositorySettingsPrimitive {

  constructor(){
    this.appStartCount = "appStartCount"
  }

  getAppStartCount(){
    if(localStorage.getItem(this.appStartCount)){
      return parseInt(localStorage.getItem(this.appStartCount));
    }
    else return 0;
  }

  incrementAppStartCount(){
    localStorage.setItem(this.appStartCount, this.getAppStartCount() + 1);
  }
}
