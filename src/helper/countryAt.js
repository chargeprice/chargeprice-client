// Country of the station closest to the given location (e.g. the map center), null if no station has one
export default function countryAt(stations, location){
  let closest = null;
  let closestDistance = Number.MAX_VALUE;

  stations.forEach(station=>{
    if(!station.country) return;
    const distance = Math.pow(station.latitude - location.latitude, 2) + Math.pow(station.longitude - location.longitude, 2);
    if(distance < closestDistance){
      closest = station;
      closestDistance = distance;
    }
  });

  return closest ? closest.country : null;
}
