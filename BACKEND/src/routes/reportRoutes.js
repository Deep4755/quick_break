const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { createReport, getReportsByStation } = require("../controllers/reportController");

// POST /api/reports — works for both logged-in users and guests
router.post("/", protect, createReport);

// GET /api/reports/station/:stationId — public
router.get("/station/:stationId", getReportsByStation);

module.exports = router;
