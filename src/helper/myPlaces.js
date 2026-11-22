// The user's own places ("home", "office"): address typed in the account panel, geocoded with
// LocationIQ and shown on the map with their icon. Kept in this browser only.
const STORAGE_KEY = "cp-my-places";

export const PLACE_TYPES = [
  { id: "home", icon: "fa-house" },
  { id: "office", icon: "fa-briefcase" },
];

export function getMyPlaces(){
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch(e) { return {}; }
}

// place: { address, latitude, longitude } or null to remove it
export function setMyPlace(type, place){
  const places = getMyPlaces();
  if(place) places[type] = place;
  else delete places[type];
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(places)); } catch(e) {}
  window.dispatchEvent(new CustomEvent("cp-my-places-changed"));
}
