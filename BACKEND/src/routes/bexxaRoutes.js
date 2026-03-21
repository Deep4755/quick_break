const express    = require("express");
const router     = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPageData,
  getStatus,
  query,
  logInteraction,
} = require("../controllers/bexxaController");

router.get("/page-data",     getPageData);
router.get("/status",        getStatus);
router.post("/query",        protect, query);          // protect allows anonymous (req.user = null)
router.post("/interactions", protect, logInteraction);

module.exports = router;
