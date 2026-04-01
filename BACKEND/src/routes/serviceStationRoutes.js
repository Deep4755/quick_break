const express = require("express");
const router = express.Router();

const {
  getAllStations,
  getNearbyStations,
  getStationById,
  createStation,
  deleteStation,
  searchStations,
} = require("../controllers/serviceStationController");

const { seedStations } = require("../utils/seedStations");

// Seed (demo)
router.post("/seed", seedStations);

// Search by name/operator/address — must be before /:id to avoid conflict
router.get("/search", searchStations);

// Facility-filtered nearby (for Bexxa voice commands)
router.get("/nearby-by-facility", getNearbyStations);

// Normal routes
router.get("/", getAllStations);
router.get("/nearby", getNearbyStations);
router.get("/:id", getStationById);
router.post("/", createStation);
router.delete("/:id", deleteStation);

module.exports = router;
