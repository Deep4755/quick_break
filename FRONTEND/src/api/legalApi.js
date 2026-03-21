import api from "./axios";

const legalApi = {
  getDocument: (slug) => api.get(`/legal/${slug}`).then(r => r.data),
};

export default legalApi;
