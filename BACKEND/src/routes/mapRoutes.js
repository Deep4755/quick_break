const express = require("express");
const router = express.Router();

const { 
  directions, 
  reverse, 
  forward, 
  route, 
  searchLocation, 
  reverseGeocodeTomTom 
} = require("../controllers/mapController");

// Mapbox routes (existing)
router.get("/directions", directions);
router.get("/reverse", reverse);
router.get("/forward", forward);

// TomTom routes (new)
router.get("/route", route);
router.get("/search-location", searchLocation);
router.get("/reverse-geocode", reverseGeocodeTomTom);

module.exports = router;
