import api from "./axios";

// Map / location related API calls
const mapApi = {
  // Example: if your backend has something like GET /api/map/reverse?lat=..&lng=..
  reverseGeocode: (lat, lng) =>
    api.get("/map/reverse", { params: { lat, lng } }).then((res) => res.data),

  // Example: if your backend has GET /api/map/route?startLat&startLng&endLat&endLng
  getRoute: (startLat, startLng, endLat, endLng) =>
    api
      .get("/map/route", {
        params: { startLat, startLng, endLat, endLng },
      })
      .then((res) => res.data),
};

export default mapApi;