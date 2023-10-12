import RepositoryAuthTokens from "./authTokens";

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

  setLastDeeplinkStation(id, dataAdapter){
    localStorage.setItem("lastDeeplinkStation", JSON.stringify({id, dataAdapter}));
  }

  getLastDeeplinkStation(){
    const value = localStorage.getItem("lastDeeplinkStation");
    if(value == undefined) return null;
    else return JSON.parse(value);
  }

  setBoolean(key, value){
    localStorage.setItem(key, value);
  }

  getBoolean(key, fallback=false){
    const value = localStorage.getItem(key);
    if(value == undefined) return fallback;
    else return value == "true"
  }

  setFloat(key,value){
    localStorage.setItem(key, value);
  }

  getFloat(key, fallback=null){
    const value = localStorage.getItem(key);
    if(value == undefined) return fallback;
    else return parseFloat(value);
  }

  setObject(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  getObject(key, fallback=null){
    const value = localStorage.getItem(key);
    if(value == undefined) return fallback;
    return JSON.parse(value);
  }

  clear(key){
    localStorage.removeItem(key);
  }

  hasKey(key) {
    return localStorage.getItem(key) != null;
  }

  authTokens(){
    return new RepositoryAuthTokens(this);
	}
}
