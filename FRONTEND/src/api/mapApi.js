import api from "./axios";

// Map / location related API calls
const mapApi = {
  // Mapbox services (existing)
  reverseGeocode: (lat, lng) =>
    api.get("/map/reverse", { params: { lng, lat } }).then((res) => res.data),

  getDirections: (fromLng, fromLat, toLng, toLat) =>
    api.get("/map/directions", { 
      params: { fromLng, fromLat, toLng, toLat } 
    }).then((res) => res.data),

  forwardGeocode: (query) =>
    api.get("/map/forward", { params: { query } }).then((res) => res.data),

  // TomTom services (new)
  getRoute: (fromLat, fromLng, toLat, toLng) =>
    api.get("/map/route", {
      params: { fromLat, fromLng, toLat, toLng },
    }).then((res) => res.data),

  searchLocation: (query) =>
    api.get("/map/search-location", { params: { q: query } }).then((res) => res.data),

  reverseGeocodeTomTom: (lat, lng) =>
    api.get("/map/reverse-geocode", { params: { lat, lng } }).then((res) => res.data),
};

export default mapApi;