const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const { createReport, getReportsByStation } = require("../controllers/reportController");

// /api/reports
router.post("/", createReport);

// /api/reports/station/:stationId
router.get("/station/:stationId", getReportsByStation);

// POST create report should be protected
router.post("/", protect, createReport);

module.exports = router;
