import api from "./axios";

const helpCenterApi = {
  getPageData:      ()       => api.get("/help-center/page-data").then(r => r.data),
  getCategories:    ()       => api.get("/help-center/categories").then(r => r.data),
  getFaqs:          ()       => api.get("/help-center/faqs").then(r => r.data),
  getArticles:      (params) => api.get("/help-center/articles", { params }).then(r => r.data),
  getArticleBySlug: (slug)   => api.get(`/help-center/articles/${slug}`).then(r => r.data),
};

export default helpCenterApi;
