mapGlobal = null;
mapChildren = []
currentSidebarContentKey=null;

sidebarContent = {
  "settings": {
    header: "Eingaben",
    contentId: "settingsContent"
  },
  "info": {
    header: "Info",
    contentId: "infoContent"
  },
  "prices": {
    header: "Preise",
    contentId: "pricesContent"
  }
}

function init() {
  if(!navigator.geolocation){
    //$("#currentLocation").hide()
  }

  $("#adapt-settings").click(()=> {showSidebar("settings")});
  $("#show-info").click(()=> {showSidebar("info")});

  initMap();
  showMap(true);
  closeSidebar();
  hideAllSidebarContent();
  getCurrentLocation();
}

function initMap() {
  mapGlobal = L.map('map')
  L.tileLayer('http://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    id: 'mapbox.streets'
  }).addTo(mapGlobal);
}


function getCurrentLocation(){
  navigator.geolocation.getCurrentPosition((pos)=>{
    const coords = pos.coords
    mapGlobal.setView([coords.latitude, coords.longitude], 13);
  }, (error)=>{
    alert("Standort konnte nicht ermittelt werden!");
    mapGlobal.setView([51.505, -0.09], 13);
  });
}

function showMap(show) {
  if (show) {
    $("#input").hide();
    $("#map").show();
  }
  else {
    $("#input").show();
    $("#map").hide();
  }
}

function showSidebar(contentKey) {
  document.getElementById("sidebar").style.display = "block";

  const content = sidebarContent[contentKey];
  $("#sidebarHeader").text(content.header)

  if(currentSidebarContentKey){
    const oldContent = sidebarContent[currentSidebarContentKey];
    $(`#${oldContent.contentId}`).hide();
  }
  $(`#${content.contentId}`).show();
  currentSidebarContentKey=contentKey;
}

function closeSidebar() {
  document.getElementById("sidebar").style.display = "none";
}

function hideAllSidebarContent(){
  for(var key in sidebarContent){
    const content = sidebarContent[key];
    $(`#${content.contentId}`).hide();
  }
}




$(document).ready(function () {
  init();
});