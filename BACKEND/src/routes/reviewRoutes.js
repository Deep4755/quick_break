const express    = require("express");
const router     = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getReviews,
  getStats,
  createReview,
  markHelpful,
  getByStation,
  searchStations,
} = require("../controllers/reviewController");

// Order matters — specific routes before parameterised ones
router.get("/stats",                  getStats);
router.get("/search-stations",        searchStations);
router.get("/station/:stationId",     getByStation);
router.get("/",                       getReviews);
router.post("/",           protect,   createReview);
router.post("/:reviewId/helpful", protect, markHelpful);

module.exports = router;
