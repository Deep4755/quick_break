import api from "./axios";

const guestAccessApi = {
  getPageData:   ()      => api.get("/guest-access/page-data").then(r => r.data),
  startSession:  (data)  => api.post("/guest-access/start", data).then(r => r.data),
  endSession:    (token) => api.post("/guest-access/end", {}, { headers: { "x-guest-token": token } }).then(r => r.data),
};

export default guestAccessApi;
