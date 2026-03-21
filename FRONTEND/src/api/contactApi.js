import api from "./axios";

const contactApi = {
  getPageData:   ()     => api.get("/contact/page-data").then(r => r.data),
  sendMessage:   (data) => api.post("/contact/messages", data).then(r => r.data),
};

export default contactApi;
