class LocationSearch {
  constructor() {
    this.autocomplete = new google.maps.places.Autocomplete(document.getElementById('search-box'));
    this.autocomplete.addListener('place_changed', this.onPlaceChanged.bind(this));
    this.callback = null;
  }

  onPlaceChanged() {
    const place = this.autocomplete.getPlace();
    const coordinates = {
      longitude: place.geometry.location.lng(),
      latitude: place.geometry.location.lat()
    };
    
    if(this.callback) this.callback(coordinates);
  }

  onResultSelected(callback){
    this.callback = callback;
  }
}