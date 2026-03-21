import api from "./axios";

const bexxaApi = {
  getPageData: () => api.get("/bexxa/page-data").then(r => r.data),
  getStatus:   () => api.get("/bexxa/status").then(r => r.data),
  query: (query, lat, lng) =>
    api.post("/bexxa/query", { query, lat, lng }).then(r => r.data),
};

export default bexxaApi;
