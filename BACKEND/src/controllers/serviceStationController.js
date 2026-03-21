const ServiceStation = require("../models/ServiceStation");
const Report = require("../models/Report");
// Helper: safely convert to number
const toNumber = (val, fallback) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};
// Helper: extract motorway like M4, M25 from address text
const extractMotorway = (text = "") => {
  const m = String(text).match(/\bM\d{1,2}\b/i);
  return m ? m[0].toUpperCase() : null;
};

const guessOperator = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("shell")) return "Shell";
  if (n.includes("bp")) return "BP";
  if (n.includes("esso")) return "Esso";
  if (n.includes("tesco")) return "Tesco";
  if (n.includes("moto")) return "Moto";
  if (n.includes("welcome break")) return "Welcome Break";
  if (n.includes("roadchef")) return "Roadchef";
  if (n.includes("extra")) return "Extra";
  return null;
};

/**
 * GET /api/service-stations
 * Basic list (optional: later add pagination)
 */
exports.getAllStations = async (req, res, next) => {
  try {
    const facilitiesParam = req.query.facilities; // "fuel,ev"
    const query = {};

    if (facilitiesParam) {
      const facilitiesArr = facilitiesParam
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);

      if (facilitiesArr.length) {
        query.facilities = { $all: facilitiesArr };
      }
    }

    // Simple list from DB (limit to 50)
    const stations = await ServiceStation.find(query).limit(50);
    return res.status(200).json(stations);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/service-stations/nearby?lat=51.5&lng=-0.12&radiusKm=10
 * Returns nearest stations within radius using Geo query.
 * If fewer than MIN_RESULTS found, auto-widens radius up to MAX_RADIUS_KM.
 */
exports.getNearbyStations = async (req, res, next) => {
  try {
    const lat      = toNumber(req.query.lat, null);
    const lng      = toNumber(req.query.lng, null);
    const radiusKm = toNumber(req.query.radiusKm, 10);

    if (lat === null || lng === null) {
      res.status(400);
      throw new Error("lat and lng are required query params");
    }

    const facilitiesParam = req.query.facilities;
    let facilitiesFilter  = null;
    let selectedFacilities = [];

    if (facilitiesParam) {
      const arr = facilitiesParam.split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
      if (arr.length) { facilitiesFilter = { $all: arr }; selectedFacilities = arr; }
    }

    console.log(`[getNearbyStations] lat=${lat} lng=${lng} radiusKm=${radiusKm} facilities=${facilitiesParam || "none"}`);

    const MIN_RESULTS   = 6;
    // Build radius steps: always start with user's chosen radius, then widen
    const RADIUS_STEPS = Array.from(new Set([radiusKm, 25, 50, 100, 200].filter(r => r >= radiusKm)));

    let stations = [];
    let usedFallback = false;

    for (const r of RADIUS_STEPS) {
      const maxDistanceMeters = r * 1000;

      try {
        // Try $near first (requires 2dsphere index)
        const mongoQuery = {
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: [lng, lat] },
              $maxDistance: maxDistanceMeters,
            },
          },
        };
        if (facilitiesFilter) mongoQuery.facilities = facilitiesFilter;

        stations = await ServiceStation.find(mongoQuery).limit(50);
        console.log(`[getNearbyStations] $near radius=${r}km → ${stations.length} station(s)`);
      } catch (nearErr) {
        // $near failed (index not ready) — fall back to $geoWithin + manual sort
        console.warn(`[getNearbyStations] $near failed (${nearErr.message}), using $geoWithin fallback`);
        usedFallback = true;
        const fallbackQuery = {
          location: {
            $geoWithin: {
              $centerSphere: [[lng, lat], maxDistanceMeters / 6378100],
            },
          },
        };
        if (facilitiesFilter) fallbackQuery.facilities = facilitiesFilter;
        stations = await ServiceStation.find(fallbackQuery).limit(50);
        console.log(`[getNearbyStations] $geoWithin radius=${r}km → ${stations.length} station(s)`);
      }

      // Stop widening once we have enough results
      if (stations.length >= MIN_RESULTS) break;
    }

    // Sort by real distance ascending (needed when using $geoWithin fallback)
    const haversineKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    stations = stations.slice().sort((a, b) => {
      const [aLng, aLat] = a.location.coordinates;
      const [bLng, bLat] = b.location.coordinates;
      return haversineKm(lat, lng, aLat, aLng) - haversineKm(lat, lng, bLat, bLng);
    });

    // Attach computed distance to each station for frontend display
    const stationsWithDistance = stations.map(s => {
      const obj = s.toObject();
      const [sLng, sLat] = obj.location.coordinates;
      obj.distanceKm = parseFloat(haversineKm(lat, lng, sLat, sLng).toFixed(2));
      obj.distanceMi = parseFloat((obj.distanceKm * 0.621371).toFixed(2));
      return obj;
    });

    console.log(`[getNearbyStations] returning ${stationsWithDistance.length} station(s)`);
    return res.status(200).json(stationsWithDistance.slice(0, 12));

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/service-stations/:id
 * Station detail + latest reports (to show crowd updates)
 */
exports.getStationById = async (req, res, next) => {
  try {
    const station = await ServiceStation.findById(req.params.id);

    if (!station) {
      res.status(404);
      throw new Error("Service station not found");
    }

    // latest 10 reports for that station
    const reports = await Report.find({ stationId: station._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ station, reports });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/service-stations
 * Create station (demo/admin use)
 * Body: { name, motorway, operator, lng, lat, facilities[] }
 */
exports.createStation = async (req, res, next) => {
  try {
    const { name, motorway, operator, lat, lng, address, facilities } = req.body;

    if (!name) {
      res.status(400);
      throw new Error("name is required");
    }
    if (lat === undefined || lng === undefined) {
      res.status(400);
      throw new Error("lat and lng are required");
    }

    const station = await ServiceStation.create({
      name,
      motorway,
      operator,
      address,
      facilities: Array.isArray(facilities) ? facilities : [],
      location: {
        type: "Point",
        coordinates: [Number(lng), Number(lat)], // [lng, lat]
      },
    });

    res.status(201).json(station);
  } catch (err) {
    next(err);
  }
};
/**
 * GET /api/service-stations/search?q=Heston
 * Case-insensitive partial match on name, operator, address
 */
exports.searchStations = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      res.status(400);
      throw new Error("q (search query) is required");
    }

    const regex = new RegExp(q, "i"); // case-insensitive partial match

    const stations = await ServiceStation.find({
      $or: [
        { name: regex },
        { operator: regex },
        { address: regex },
        { motorway: regex },
      ],
    })
      .limit(10)
      .select("_id name operator address motorway location");

    console.log(`[searchStations] query="${q}" found ${stations.length} result(s)`);
    res.status(200).json(stations);
  } catch (err) {
    next(err);
  }
};

exports.deleteStation = async (req, res, next) => {
  try {
    const station = await ServiceStation.findById(req.params.id);

    if (!station) {
      res.status(404);
      throw new Error("Service station not found");
    }

    await station.deleteOne();

    res.status(200).json({ message: "Service station deleted", stationId: req.params.id });
  } catch (err) {
    next(err);
  }
};

