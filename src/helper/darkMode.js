// Color mode: "light", "dark" or "system" (follows prefers-color-scheme).
// The choice is kept in the browser; without a saved choice "system" is used.
const STORAGE_KEY = "cp-color-mode";
const systemQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

export function getColorMode(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved === "light" || saved === "dark") return saved;
  } catch(e) {}
  return "system";
}

export function isDarkMode(){
  const mode = getColorMode();
  if(mode === "system") return !!(systemQuery && systemQuery.matches);
  return mode === "dark";
}

export function applyDarkMode(){
  const dark = isDarkMode();
  document.documentElement.classList.toggle("dark", dark);
  const themeColor = document.getElementById("theme-color");
  if(themeColor){
    if(!themeColor.dataset.light) themeColor.dataset.light = themeColor.getAttribute("content");
    themeColor.setAttribute("content", dark ? "#0b4f9e" : themeColor.dataset.light);
  }
}

export function setColorMode(mode){
  try {
    if(mode === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch(e) {}
  applyDarkMode();
  // Several switches show the mode (top bar, account panel): let them refresh
  window.dispatchEvent(new CustomEvent("cp-color-mode-changed", { detail: { mode } }));
}

// In "system" mode, follow the OS when it switches between light and dark
if(systemQuery){
  const onSystemChange = ()=>{ if(getColorMode() === "system") applyDarkMode(); };
  if(systemQuery.addEventListener) systemQuery.addEventListener("change", onSystemChange);
  else if(systemQuery.addListener) systemQuery.addListener(onSystemChange);
}
