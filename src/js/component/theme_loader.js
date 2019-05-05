class ThemeLoader {
  constructor(translation) {
    this.defaultTheme = "default";
    this.themes = {
      [this.defaultTheme] : {
        titleBarHtml: "<img id=\"logo\" src=\"img/logo.png\"/>",
        title: translation.get("title"),
        favicon: "favicon-32x32.png",
        name: "Plugchecker",
        themeColor: "#3498db"
      },
      emc: {
        titleBarHtml: "<img id=\"logo\" src=\"img/emc.png\"/><span class=\"title\">Ladepreise</span>",
        title: "EMC Ladepreise - Powered by Plugchecker.com",
        favicon: "img/emc.png",
        name: "EMC Ladepreise",
        themeColor: "#8fbf22"
      }
    }
  }

  getValidatedTheme(){
    const theme = new URL(window.location.href).searchParams.get("theme");
    return this.themes.hasOwnProperty(theme) ? theme : this.defaultTheme;
  }

  setCurrentTheme(){
    const themeId = this.getValidatedTheme();
    const theme = this.themes[themeId];

    // Set CSS
    var newSS=document.createElement('link');
    newSS.rel='stylesheet';
    newSS.href=`css/themes/${themeId}.css`;
    document.getElementsByTagName("head")[0].appendChild(newSS);

    // Title Bar
    document.getElementById("logo-container").innerHTML = theme.titleBarHtml;

    // Title
    document.getElementsByTagName("title")[0].innerText = theme.title;

    // Favicon
    document.getElementById("pc-icon").setAttribute("href",theme.favicon);

    // Theme Color
    document.getElementById("theme-color").setAttribute("content",theme.themeColor);

    if(themeId == this.defaultTheme) {
      document.getElementById("theme-info").setAttribute("style","display: none;")
    }
    else {
      document.getElementById("theme-name").innerText = theme.name;
    }
  }

  
}