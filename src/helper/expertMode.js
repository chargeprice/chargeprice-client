// "Expert" mode: shows extra technical details (station ids, charge points, tariff ids).
// The choice is kept in this browser only.
const STORAGE_KEY = "cp-expert-mode";

export function isExpertMode(){
  try { return localStorage.getItem(STORAGE_KEY) === "on"; } catch(e) { return false; }
}

export function setExpertMode(on){
  try {
    if(on) localStorage.setItem(STORAGE_KEY, "on");
    else localStorage.removeItem(STORAGE_KEY);
  } catch(e) {}
  document.documentElement.classList.toggle("expert", !!on);
  window.dispatchEvent(new CustomEvent("cp-expert-mode-changed", { detail: { on: !!on } }));
}
