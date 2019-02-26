const CORS_URL = "https://cors-anywhere.herokuapp.com/";
const SERVICE_URL = "https://api.e-control.at/sprit/1.0/search/gas-stations/by-address";

function getDirections(origin, destination) {
  return new Promise((resolve, reject) => {
    var directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin: origin,
      destination: destination,
      travelMode: 'DRIVING'
    }, (response, status) => {
      if (response["routes"].length == 0) {
        reject();
        return;
      }

      var overview_polyline = response["routes"][0]["overview_polyline"];
      var decodedPath = google.maps.geometry.encoding.decodePath(overview_polyline).map(pt => [pt.lat(), pt.lng()]);
      resolve(decodedPath);
    });
  });
}

function getSpritpreis(bbs, type, onlyOpen) {
  const url = `${CORS_URL}${SERVICE_URL}?latitude=${bbs[0]}&longitude=${bbs[1]}&fuelType=${type}&includeClosed=${onlyOpen}`;
  return fetch(url).then(res => res.json());
}

function getSpritpreisForRoute(pts, type, onlyOpen) {
  var stations = [];
  var cnt = 0;
  return new Promise((resolve, reject) => {
    pts.forEach(pt => {
      getSpritpreis(pt, type, onlyOpen).then(p => {
        cnt++;
        stations = stations.concat(p);
        if (cnt == pts.length) {
          resolve(distinctStations(stations));
        }
      });
    });
  });
}

function distinctStations(stations) {
  var filtered = [];
  stations.forEach(val => {
    var keep = !filtered.some(el => el["location"]["city"] + el["location"]["address"] == val["location"]["city"] + val["location"]["address"]);
    if (keep) keep = val["prices"].length > 0;
    if (keep) filtered.push(val);
  });
  return filtered.sort(comparePrice);
}

function comparePrice(a, b) {
  var aP = parseFloat(a["prices"][0]["amount"]);
  var bP = parseFloat(b["prices"][0]["amount"]);
  return aP - bP;
}