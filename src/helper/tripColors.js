// Route color by the remaining range on this part of the trip (trips API: state_of_charge_category),
// ordered from full to empty
export const TRIP_SEGMENT_CATEGORIES = ["normal", "warning", "low", "critical", "empty"];

export const TRIP_SEGMENT_COLORS = {
  normal: "#007AFF",   // > 150 km remaining range
  warning: "#f2c200",  // < 150 km
  low: "#ff8229",      // < 100 km
  critical: "#f74a56", // < 50 km
  empty: "#8e24aa"     // 0 km
};
