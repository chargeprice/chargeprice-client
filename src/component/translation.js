require('jsrender')($);

export default class Translation {
  constructor() {
    this.supportedLocales = ["en","de","fr","nl"]
    this.fallbackLocale = "en"
    this.currentLocale = this.currentLocaleOrFallback(); 
    this.unbalancedLoadLocales = ["de"];
    this.setHelpers();
  }
  
  setHelpers(){
    $.views.helpers("t",this.get.bind(this));
    $.views.helpers("sf",this.stringFormat);
  }

  translateMeta(){
    this.setMeta("metaTitle", `Chargeprice - ${this.get("metaTitle")}`);
    this.setMeta("metaDescription", this.get("metaDescription"));
    this.setMeta("metaKeywords", this.get("metaKeywords"));
    this.setMeta("metaLanguage", this.currentLocale);

    this.setMeta("ogTitle", this.get("metaTitle"));
    this.setMeta("ogDescription", this.get("metaDescription"));
  }

  setMeta(id, value){
    document.getElementById(id).setAttribute("content",value);
  }

  currentLocaleOrFallback(){
    return this.languageFromUrl() ||
      navigator.languages.map(l=>l.split("-")[0]).find(l=>this.isValidLanguage(l)) || 
      this.fallbackLocale;
  }

  async setCurrentLocaleTranslations(){
    const url = `/locales/${this.currentLocale}.json`;
    const response = await fetch(url);
    this.currentLocaleTranslations = await response.json();
  }

  languageFromUrl(){
    const urlLang = new URL(window.location.href).searchParams.get("lang")
    return this.isValidLanguage(urlLang) ? urlLang : null;
  }

  isValidLanguage(lang){
    return this.supportedLocales.includes(lang);
  }

  get(key){
    return this.currentLocaleTranslations[key] || "";
  }

  stringFormat(source,...params){
    return params.reduce((memo,n,i)=>{
      return memo.replace(new RegExp("\\{" + i + "\\}", "g"), n);
    },source);
  }

  stringFormatWithKey(key,...params){
    return this.stringFormat(this.get(key),...params);
  }

  showUnbalancedLoad(){
    return this.unbalancedLoadLocales.includes(this.currentLocale);
  }
}