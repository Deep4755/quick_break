const express = require("express");
const router = express.Router();

const {
  getAllStations,
  getNearbyStations,
  getStationById,
  createStation,
  deleteStation,
} = require("../controllers/serviceStationController");

const { seedStations } = require("../utils/seedStations");

// Seed (demo)
router.post("/seed", seedStations);

// Normal routes
router.get("/", getAllStations);
router.get("/nearby", getNearbyStations);
router.get("/:id", getStationById);
router.post("/", createStation);
router.delete("/:id", deleteStation);

module.exports = router;
