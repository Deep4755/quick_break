const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  saveStation,
  getSavedStations,
  removeSavedStation,
  checkSaved,
  checkBulk,
} = require("../controllers/savedStationController");

// Check must come before /:stationId to avoid route conflict
router.get("/check-bulk", protect, checkBulk);
router.get("/check/:stationId", protect, checkSaved);

router.get("/", protect, getSavedStations);
router.post("/", protect, saveStation);
router.delete("/:stationId", protect, removeSavedStation);

module.exports = router;
