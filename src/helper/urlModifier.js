export default class UrlModifier {
  modifyUrlParam(params) {
    if (window.history.replaceState) {
        let searchParams = new URLSearchParams(window.location.search);
        for(const key in params){
          searchParams.set(key, params[key]);
        }
        
        let newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + searchParams.toString();
        window.history.replaceState({path: newurl}, '', newurl);
    }
  }
}