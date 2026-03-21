import api from "./axios";

const savedStationApi = {
  save: (data) => api.post("/saved-stations", data),
  getAll: () => api.get("/saved-stations").then((r) => r.data),
  remove: (stationId) => api.delete(`/saved-stations/${stationId}`),
  check: (stationId) => api.get(`/saved-stations/check/${stationId}`).then((r) => r.data),
  checkBulk: (stationIds) =>
    api
      .get("/saved-stations/check-bulk", { params: { stationIds: stationIds.join(",") } })
      .then((r) => r.data.saved || {}),
};

export default savedStationApi;
