export default class RepositoryStartTime {

  constructor(){
    this.defaultValue = null;
    this.currentValue = null;
    this.cached = false;
    this.key = "startTime"
  }

  set(value){
    this.cached = true;
    this.currentValue = value;
    localStorage.setItem(this.key, value == null ? "current" : value);
  }

  get(){
    if(this.cached) return this.currentValue;
    if(localStorage.getItem(this.key)){
      const value = localStorage.getItem(this.key);
      this.currentValue = (value == "current" ? null : parseInt(value));
    }
    else{
      this.currentValue = this.defaultValue;
    }

    this.cached = true;
    return this.currentValue;
  }  
}

