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

  // Changes only the path, query and hash are kept
  setPath(path){
    if (window.history.replaceState && window.location.pathname !== path) {
      let newurl = window.location.protocol + "//" + window.location.host + path + window.location.search + window.location.hash;
      window.history.replaceState({path: newurl}, '', newurl);
    }
  }

  resetUrl(){
    if (window.history.replaceState) {     
      let newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({path: newurl}, '', newurl);
  }
  }
}