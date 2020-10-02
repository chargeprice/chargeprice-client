export default class ThemeLoader {
  constructor(translation) {
    this.translation = translation;
    this.defaultTheme = "plugchecker";
    this.themes = {
      [this.defaultTheme] : {
        titleBarHtml: "chargeprice",
        title: translation.get("title"),
        favicon: "img/favicon-32x32.png",
        themeColor: "#3498db",
        appleTouchIcon: "/img/logos/apple-touch-icon.png"
      },
      emc: {
        titleBarHtml: `<a href="https://www.emcaustria.at/" target="_blank"><img id=\"logo\" src=\"themes/emc/logo.png\"/><img id=\"logoText\" src=\"themes/emc/logo_text.png\"/></a>`,
        favicon: "themes/emc/logo.png",
        name: `EMC ${translation.get("themeTitle")}`,
        themeColor: "#8fbf22",
        appleTouchIcon: "themes/emc/logo.png"
      },
      nissan: {
        titleBarHtml: `<img id=\"logo\" src=\"themes/nissan/logo.png\"/><span class=\"title\">${translation.get("themeTitle")}</span>`,
        favicon: "themes/nissan/logo.png",
        name: `Nissan ${translation.get("themeTitle")}`,
        themeColor: "#c3002f",
        appleTouchIcon: "/img/logos/apple-touch-icon.png"
      },
      oeamtc: {
        titleBarHtml: `<img id=\"logo\" src=\"themes/oeamtc/logo.png\"/><span class=\"title\">${translation.get("themeTitle")}</span>`,
        favicon: "themes/oeamtc/logo.png",
        name: `ÖAMTC Ladepreise`,
        themeColor: "#ffdc00",
        appleTouchIcon: "themes/oeamtc/logo.png"
      },
      "billig-tanken" : {
        titleBarHtml: "chargeprice",
        title: translation.get("title"),
        favicon: "img/favicon-32x32.png",
        name: `Billig Tanken Ladeäulen`,
        themeColor: "#009688",
        appleTouchIcon: "/img/logos/apple-touch-icon.png"
      },
      aprr: {
        titleBarHtml: `<img id=\"logo\" src=\"themes/aprr/logo.png\"/><span class=\"title\">${translation.get("themeTitle")}</span>`,
        favicon: "themes/aprr/logo.png",
        name: translation.get("themeTitle"),
        themeColor: "#ce0000",
        appleTouchIcon: "themes/aprr/logo.png"
      },
    }
  }

  isDefaultTheme(){
    return this.getValidatedTheme() == this.defaultTheme;
  }

  getValidatedTheme(){
    if(window.location.hostname.includes("ladepreise.at")) return "emc";

    const theme = new URL(window.location.href).searchParams.get("theme");
    return this.themes.hasOwnProperty(theme) ? theme : this.defaultTheme;
  }

  setCurrentTheme(){
    const themeId = this.getValidatedTheme();
    const theme = this.themes[themeId];

    // Set CSS
    var newSS=document.createElement('link');
    newSS.rel='stylesheet';
    newSS.href=`themes/${themeId}/style.css`;
    document.getElementsByTagName("head")[0].appendChild(newSS);

    // Title Bar
    document.getElementById("logo-container").innerHTML = theme.titleBarHtml;

    // Favicon
    document.getElementById("metaIcon").setAttribute("href",theme.favicon);
    document.getElementById("metaAppleIcon").setAttribute("href",theme.appleTouchIcon);
    document.getElementById("metaManifest").setAttribute("href",`themes/${themeId}/site.webmanifest`);

    // Theme Color
    document.getElementById("theme-color").setAttribute("content",theme.themeColor);
    
    if(themeId == this.defaultTheme) {
      document.getElementById("theme-info").setAttribute("style","display: none;")
      document.getElementsByTagName("title")[0].innerText = theme.title;
    }
    else {
      document.getElementById("donate-button").setAttribute("style","display: none;");
      document.getElementById("theme-name").innerText = theme.name;
      document.getElementsByTagName("title")[0].innerText = `${theme.name} ${this.translation.get("poweredBy")} Chargeprice`;
    }
  }

  
}
