export default class Translation {
  constructor() {
    this.supportedLocales = [
      { code: "en", name: "English", flag: "gb" },
      { code: "de", name: "Deutsch", flag: "de" },
      { code: "fr", name: "Français", flag: "fr"},
      { code: "nl", name: "Nederlands", flag: "nl" },
      { code: "da", name: "Dansk", flag: "dk" }
    ];
    this.fallbackLocale = "en"
    this.currentLocale = this.currentLocaleOrFallback();
    this.unbalancedLoadLocales = ["de"];
  }

  translateMeta(){
    this.setMeta("metaTitle", `Chargeprice - ${this.get("metaTitle")}`);
    this.setMeta("metaDescription", this.get("metaDescription"));
    this.setMeta("metaKeywords", this.get("metaKeywords"));
    this.setMeta("metaLanguage", this.currentLocale);

    this.setMeta("ogTitle", this.get("metaTitle"));
    this.setMeta("ogDescription", this.get("metaDescription"));

    document.documentElement.setAttribute("lang", this.currentLocale);
  }

  setMeta(id, value){
    document.getElementById(id).setAttribute("content",value);
  }

  currentLocaleOrFallback(){
    return this.languageFromDomain() ||
      this.languageFromQuery() ||
      this.languageFromBrowserSetting()||
      this.fallbackLocale;
  }

  currentLocaleConfig(){
    return this.supportedLocales.find(l=>l.code==this.currentLocale);
  }

  async setCurrentLocaleTranslations(){
    const url = `/locales/${this.currentLocale}.json`;
    const response = await fetch(url);
    this.currentLocaleTranslations = await response.json();
  }

  languageFromDomain(){
    const domainLang = new URL(window.location.href).hostname.split(".")[0];
    return this.isValidLanguage(domainLang) ? domainLang : null;
  }

  languageFromQuery(){
    const urlLang = new URL(window.location.href).searchParams.get("lang")
    return this.isValidLanguage(urlLang) ? urlLang : null;
  }

  languageFromBrowserSetting(){
    return navigator.languages.map(l=>l.split("-")[0]).find(l=>this.isValidLanguage(l));
  }

  isValidLanguage(lang){
    return this.supportedLocales.find(l=>l.code==lang);
  }

  getSupportedLocales(){
    return this.supportedLocales;
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
