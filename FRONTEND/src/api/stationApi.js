import api from "./axios";

const stationApi = {
  nearby: (lng, lat, radiusKm, facilities) => {
    const params = { lng, lat, radiusKm };
    if (facilities) {
      params.facilities = Array.isArray(facilities) ? facilities.join(",") : facilities;
    }
    return api.get("/service-stations/nearby", { params }).then((res) => {
      const d = res.data;
      if (Array.isArray(d)) return d;
      if (d?.stations) return d.stations;
      return d;
    });
  },

  details: (id) =>
    api.get(`/service-stations/${id}`).then((res) => {
      const d = res.data;
      if (d?.station) return d.station;
      return d;
    }),

  // Search stations by name / operator / address
  search: (q) =>
    api.get("/service-stations/search", { params: { q } }).then((res) => res.data),
};

export default stationApi;
