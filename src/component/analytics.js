export default class Analytics {
  log(){
    if(typeof(ga) == "undefined") return;
    ga.apply(null,arguments);
  }
}

