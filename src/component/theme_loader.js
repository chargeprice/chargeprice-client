import { html, render } from 'lit-html';

export default class ThemeLoader {
  constructor(depts) {
    this.translation = depts.translation();
    this.defaultTheme = "plugchecker";
    this.themeId = null;
    this.theme = null;
  }

  availableThemes(){
    return {
      [this.defaultTheme] : {
        titleBarHtml: html`<img id="logo" style="padding: 3px" src="img/logos/header-logo.svg"/>`,
        name: "Chargeprice",
        title: this.translation.get("title"),
        favicon: "img/favicon-32x32.png",
        themeColor: "#007AFF",
        appleTouchIcon: "/img/logos/apple-touch-icon.png"
      },
      emc: {
        titleBarHtml: html`
          <a href="https://www.emcaustria.at/" target="_blank">
            <img id="logo" src="themes/emc/logo.png"/>
            <img id="logoText" src="themes/emc/text.svg"/>
          </a>
        `,
        favicon: "themes/emc/logo.png",
        name: `EMC ${this.translation.get("themeTitle")}`,
        themeColor: "#8fbf22",
        appleTouchIcon: "themes/emc/logo.png",
        highlightedTariffs: ["a480edbe-d673-4faa-ad70-5d22273d15a0","d2a15ed1-b873-4aba-bf6d-070e16da6b45","51052ac3-d1d5-41f4-833d-a6e6713e76b4"]
      },
      nissan: {
        titleBarHtml: `<img id=\"logo\" src=\"themes/nissan/logo.png\"/><span class=\"title\">${this.translation.get("themeTitle")}</span>`,
        favicon: "themes/nissan/logo.png",
        name: `Nissan ${this.translation.get("themeTitle")}`,
        themeColor: "#c3002f",
        appleTouchIcon: "/img/logos/apple-touch-icon.png"
      },
      oeamtc: {
        titleBarHtml: `<img id=\"logo\" src=\"themes/oeamtc/logo.png\"/><span class=\"title\">${this.translation.get("themeTitle")}</span>`,
        favicon: "themes/oeamtc/logo.png",
        name: `ÖAMTC Ladepreise`,
        themeColor: "#ffdc00",
        appleTouchIcon: "themes/oeamtc/logo.png"
      },
      "billig-tanken" : {
        titleBarHtml: html`<img id="logo" style="padding: 3px" src="img/logos/header-logo.svg"/>`,
        title: this.translation.get("title"),
        favicon: "img/favicon-32x32.png",
        name: `Billig Tanken Ladeäulen`,
        themeColor: "#009688",
        appleTouchIcon: "/img/logos/apple-touch-icon.png"
      },
      aprr: {
        titleBarHtml: `<img id=\"logo\" src=\"themes/aprr/logo.png\"/><span class=\"title\">${this.translation.get("themeTitle")}</span>`,
        favicon: "themes/aprr/logo.png",
        name: this.translation.get("themeTitle"),
        themeColor: "#ce0000",
        appleTouchIcon: "themes/aprr/logo.png"
      },
      asfinag: {
        titleBarHtml: `<img id=\"logo\" src=\"themes/asfinag/logo.png\"/><span class=\"title\">${this.translation.get("themeTitle")}</span>`,
        favicon: "themes/asfinag/logo.png",
        name: this.translation.get("themeTitle"),
        themeColor: "#bc5408",
        appleTouchIcon: "themes/asfinag/logo.png"
      },
      instadrive: {
        titleBarHtml: html`
          <img id="logo" class="mobile-hidden" src="themes/instadrive/logo.svg"/>
          <img id="logo" class="mobile-shown" src="themes/instadrive/icon.svg"/>
          <img id="logoText" src="themes/instadrive/text.svg"/>
        `,
        favicon: "themes/instadrive/favicon.png",
        name: "Instadrive Ladepreise",
        themeColor: "#16bae7",
        appleTouchIcon: "themes/instadrive/favicon.png"
      },
    }
  }

  isDefaultTheme(){
    this.ensureThemeSet();
    return this.themeId == this.defaultTheme;
  }

  ensureThemeSet(){
    if(this.theme && this.themeId) return; 
    const availableThemes = this.availableThemes();
    this.themeId = this.getValidatedTheme(availableThemes);
    this.theme = availableThemes[this.themeId];
  }

  getCurrentThemeConfig(){
    this.ensureThemeSet();
    return this.theme;
  }

  getCurrentThemeId(){
    this.ensureThemeSet();
    return this.themeId;
  }

  getValidatedTheme(availableThemes){
    if(window.location.hostname.includes("ladepreise.at")) return "emc";

    const theme = new URL(window.location.href).searchParams.get("theme");
    return availableThemes.hasOwnProperty(theme) ? theme : this.defaultTheme;
  }

  initializeTheme(){
    const themeId = this.getCurrentThemeId();
    const theme = this.getCurrentThemeConfig();

    // Set CSS
    var newSS=document.createElement('link');
    newSS.rel='stylesheet';
    newSS.href=`themes/${themeId}/style.css?v=1`;
    document.getElementsByTagName("head")[0].appendChild(newSS);

    // Title Bar
    if(typeof theme.titleBarHtml == "string") {
      document.getElementById("logo-container").innerHTML = theme.titleBarHtml;
    }
    else {
      render(theme.titleBarHtml,document.getElementById("logo-container"));
    }

    // Favicon
    document.getElementById("metaIcon").setAttribute("href",theme.favicon);
    document.getElementById("metaAppleIcon").setAttribute("href",theme.appleTouchIcon);
    document.getElementById("metaManifest").setAttribute("href",`themes/${themeId}/site.webmanifest`);

    // Theme Color
    document.getElementById("theme-color").setAttribute("content",theme.themeColor);
    
    if(themeId == this.defaultTheme) {
      document.getElementsByTagName("title")[0].innerText = theme.title;
    }
    else {
      document.getElementsByTagName("title")[0].innerText = `${theme.name} ${this.translation.get("poweredBy")} Chargeprice`;
    }
  }
}
