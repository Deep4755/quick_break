const ServiceStation = require("../models/ServiceStation");
const Report = require("../models/Report");

const { searchNearbyServices } = require("../services/tomtomService");
const { findPlaceDetails } = require("../services/googlePlacesService");
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
 * Returns nearest stations within radius using Geo query
 */
exports.getNearbyStations = async (req, res, next) => {
  try {
    const lat = toNumber(req.query.lat, null);
    const lng = toNumber(req.query.lng, null);
    const radiusKm = toNumber(req.query.radiusKm, 20);

    if (lat === null || lng === null) {
      res.status(400);
      throw new Error("lat and lng are required query params");
    }

    // Optional facilities filter: /nearby?facilities=fuel,ev
    const facilitiesParam = req.query.facilities; // "fuel,ev"
    let facilitiesFilter = null;
    let selectedFacilities = [];

    if (facilitiesParam) {
      const facilitiesArr = facilitiesParam
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);

      if (facilitiesArr.length) {
        facilitiesFilter = { $all: facilitiesArr };
        selectedFacilities = facilitiesArr;
      }
    }
    console.log(`[getNearbyStations] received facilitiesParam=${facilitiesParam} parsed=${JSON.stringify(selectedFacilities)}`);

    const maxDistanceMeters = radiusKm * 1000;

    const mongoQuery = {
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxDistanceMeters,
        },
      },
    };

    if (facilitiesFilter) mongoQuery.facilities = facilitiesFilter;

    // ✅ 1) DB-first
    let stations = await ServiceStation.find(mongoQuery).limit(50);
    console.log(`[getNearbyStations] mongo query returned ${stations.length} station(s)`);
    if (stations.length > 0) {
      console.log(`[getNearbyStations] returning ${stations.length} DB result(s)`);
      return res.status(200).json(stations);
    }

    // ✅ 2) TomTom fallback (limit small to avoid too many reverse calls)
    const tomtomData = await searchNearbyServices({ lat, lng, radiusKm, limit: 12 });
    const results = tomtomData?.results || [];

    const { extractFacilitiesFromTomtomResult } = require("../utils/facilityMapper");

    // ✅ 3) Map TomTom -> our schema (TomTom used only for geospatial results)
    const mapped = [];

    for (const r of results) {
      const name = r.poi?.name || r.address?.freeformAddress || "Service Station";
      // Prefer TomTom freeformAddress; leave null if not present
      const address = r.address?.freeformAddress || null;
      const coords = r.position ? [r.position.lon, r.position.lat] : null;
      if (!coords) continue;

      // Try to extract motorway from provided address first
      let motorway = extractMotorway(address);

      const operator = r.poi?.brands?.[0]?.name || guessOperator(name) || null;

      // Extract facilities using utility (includes operator enrichment)
      let facilities = extractFacilitiesFromTomtomResult(r);

      mapped.push({
        tomtomId: r.id || null,
        name,
        motorway: motorway || null,
        operator: operator || null,
        address: address || null,
        facilities, // [] if none
        location: { type: "Point", coordinates: coords },
      });
    }

    // ✅ 3b) Enrich top mapped results (limit 10) using Google Places and merge back
    const enrichedMapped = [...mapped];
    const toEnrich = mapped.slice(0, 10);
    await Promise.all(
      toEnrich.map(async (doc, idx) => {
        try {
          const latE = doc.location.coordinates[1];
          const lngE = doc.location.coordinates[0];
          const details = await findPlaceDetails({ lat: latE, lng: lngE, name: doc.name, radiusMeters: 150 });
          if (!details) return;

          // Map google types -> facilities
          const typeToFacility = {
            gas_station: "fuel",
            restaurant: "food",
            cafe: "food",
            meal_takeaway: "food",
            parking: "parking",
            electric_vehicle_charging_station: "ev",
            convenience_store: "shop",
            restroom: "toilets",
          };

          const googleFacilities = (details.types || []).map((t) => typeToFacility[t]).filter(Boolean);

          const mergedFacilities = Array.from(new Set([...(doc.facilities || []), ...googleFacilities]));

          // pick a photo URL if available
          const photoUrl = details.photoUrl || null;

          // attach enrichment
          enrichedMapped[idx] = {
            ...doc,
            facilities: mergedFacilities,
            googlePlaceId: details.placeId || null,
            rating: details.rating ?? null,
            userRatingsTotal: details.user_ratings_total ?? null,
            openNow: details.open_now ?? null,
            photoUrl,
            types: details.types ?? [],
          };
        } catch (e) {
          // ignore per-item failures
        }
      })
    );

    // If user requested facilities filter, filter enriched results before caching
    const filteredMapped = selectedFacilities.length
      ? enrichedMapped.filter((doc) => selectedFacilities.every((f) => (doc.facilities || []).includes(f)))
      : enrichedMapped;

    // ✅ 4) Cache in Mongo using upsert (avoid duplicates). We set base doc on insert and set enrichment fields on every run.
    const ops = enrichedMapped
      .filter((x) => x.tomtomId)
      .map((doc) => {
        const enrichSet = {
          facilities: doc.facilities ?? [],
        };
        if (doc.googlePlaceId !== undefined) enrichSet.googlePlaceId = doc.googlePlaceId;
        if (doc.rating !== undefined) enrichSet.rating = doc.rating;
        if (doc.opening_hours !== undefined) enrichSet.opening_hours = doc.opening_hours;
        if (doc.types !== undefined) enrichSet.types = doc.types;
        if (doc.photoUrl !== undefined) enrichSet.photoUrl = doc.photoUrl;
        if (doc.userRatingsTotal !== undefined) enrichSet.userRatingsTotal = doc.userRatingsTotal;
        if (doc.openNow !== undefined) enrichSet.openNow = doc.openNow;

        const baseInsert = {
          tomtomId: doc.tomtomId,
          name: doc.name,
          motorway: doc.motorway,
          operator: doc.operator,
          address: doc.address,
          // DO NOT include `facilities` here to avoid conflicts between $setOnInsert and $set
          location: doc.location,
        };

        return {
          updateOne: {
            filter: { tomtomId: doc.tomtomId },
            update: { $setOnInsert: baseInsert, $set: enrichSet },
            upsert: true,
          },
        };
      });

    if (ops.length) {
      await ServiceStation.bulkWrite(ops, { ordered: false });
    }

    // If we applied a filter and used TomTom fallback, prefer returning DB documents
    if (selectedFacilities.length) {
      console.log(`[getNearbyStations] TomTom mapped ${enrichedMapped.length} items, filtered to ${filteredMapped.length}`);

      // try to return DB documents for the filtered tomtomIds so frontend gets _id
      const tomtomIds = filteredMapped.map((d) => d.tomtomId).filter(Boolean);
      if (tomtomIds.length) {
        const docs = await ServiceStation.find({ tomtomId: { $in: tomtomIds } }).limit(50);
        console.log(`[getNearbyStations] returning ${docs.length} DB result(s) for tomtomIds`);
        return res.status(200).json(docs);
      }

      // fallback: return the mapped objects (no _id) if no tomtomIds available
      console.log(`[getNearbyStations] returning ${filteredMapped.length} TomTom filtered result(s) (no tomtomIds)`);
      return res.status(200).json(filteredMapped);
    }

    // ✅ 5) Return DB results (consistent response)
    stations = await ServiceStation.find(mongoQuery).limit(50);
    console.log(`[getNearbyStations] final DB query returned ${stations.length} station(s)`);
    return res.status(200).json(stations);
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

