const express = require("express");
const router  = express.Router();
const {
  getPageData,
  getCategories,
  getFaqs,
  getArticles,
  getArticleBySlug,
} = require("../controllers/helpCenterController");

router.get("/page-data",          getPageData);
router.get("/categories",         getCategories);
router.get("/faqs",               getFaqs);
router.get("/articles",           getArticles);
router.get("/articles/:slug",     getArticleBySlug);

module.exports = router;
