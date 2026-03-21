import api from "./axios";

const reviewApi = {
  getReviews:       (params) => api.get("/reviews", { params }).then(r => r.data),
  getStats:         ()       => api.get("/reviews/stats").then(r => r.data),
  createReview:     (data)   => api.post("/reviews", data).then(r => r.data),
  markHelpful:      (id)     => api.post(`/reviews/${id}/helpful`).then(r => r.data),
  getByStation:     (id)     => api.get(`/reviews/station/${id}`).then(r => r.data),
  searchStations:   (q)      => api.get("/reviews/search-stations", { params: { q } }).then(r => r.data),
};

export default reviewApi;
