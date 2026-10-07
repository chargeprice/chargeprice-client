// Pages on chargeprice.net have different paths per language, English is the fallback
const LINKS = {
  dataPlatform: {
    en: "https://www.chargeprice.net/en/charging-intelligence-data/",
    de: "https://www.chargeprice.net/de/charging-intelligence-daten/",
    fr: "https://www.chargeprice.net/fr/donnees-et-intelligence-de-recharge/"
  },
  mobileApps: {
    en: "https://www.chargeprice.net/en/applications/",
    de: "https://www.chargeprice.net/de/mobile-apps/",
    fr: "https://www.chargeprice.net/fr/applications/"
  }
};

function link(page, locale){
  return LINKS[page][locale] || LINKS[page].en;
}

export function dataPlatformLink(locale){
  return link("dataPlatform", locale);
}

export function mobileAppsLink(locale){
  return link("mobileApps", locale);
}
