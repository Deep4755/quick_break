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

  // Bexxa: find stations near coords filtered by facility
  nearbyByFacility: (lat, lng, facilities, radiusKm = 50) => {
    // Note: backend expects lng first, then lat (same as nearby())
    const params = { lng, lat, radiusKm };
    if (facilities?.length) {
      const fList = Array.isArray(facilities) ? facilities : [facilities];
      if (fList.length) params.facilities = fList.join(",");
    }
    console.log("[stationApi.nearbyByFacility] params:", params);
    return api.get("/service-stations/nearby", { params }).then((res) => {
      const d = res.data;
      if (Array.isArray(d)) return d;
      if (d?.stations) return d.stations;
      return [];
    });
  },

  details: (id) =>
    api.get(`/service-stations/${id}`).then((res) => {
      const d = res.data;
      if (d?.station) return d.station;
      return d;
    }),

  search: (q) =>
    api.get("/service-stations/search", { params: { q } }).then((res) => res.data),
};

export default stationApi;
