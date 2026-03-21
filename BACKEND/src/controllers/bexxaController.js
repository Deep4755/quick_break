const BexxaContent     = require("../models/BexxaContent");
const BexxaInteraction = require("../models/BexxaInteraction");
const ServiceStation   = require("../models/ServiceStation");

// ── helpers ──────────────────────────────────────────────────────────────────

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatStation = (s, userLat, userLng) => {
  const [sLng, sLat] = s.location?.coordinates || [];
  const distKm = (userLat && userLng && sLat && sLng)
    ? parseFloat(haversineKm(userLat, userLng, sLat, sLng).toFixed(1))
    : null;
  return {
    id:       s._id,
    name:     s.name,
    operator: s.operator || "",
    motorway: s.motorway || "",
    address:  s.address  || "",
    distanceKm,
    distanceMi: distKm != null ? parseFloat((distKm * 0.621371).toFixed(1)) : null,
    facilities: s.facilities || [],
  };
};

// Detect intent from query text
const detectIntent = (q) => {
  const t = q.toLowerCase();
  if (/ev|electric|charging/.test(t))                          return "amenity_filter";
  if (/fuel|petrol|diesel|shell|bp|esso/.test(t))              return "operator_search";
  if (/junction|j\d|j \d/.test(t))                            return "junction_lookup";
  if (/24.?7|open all|always open/.test(t))                   return "open_24_7";
  if (/nearest|closest|near me|nearby/.test(t))               return "nearby";
  if (/toilet|shower|food|coffee|parking|wifi/.test(t))       return "amenity_filter";
  return "general_help";
};

// ── GET /api/bexxa/page-data ──────────────────────────────────────────────────

exports.getPageData = async (req, res, next) => {
  try {
    let content = await BexxaContent.findOne();
    if (!content) content = await BexxaContent.create({});
    res.json(content);
  } catch (err) { next(err); }
};

// ── GET /api/bexxa/status ─────────────────────────────────────────────────────

exports.getStatus = async (req, res, next) => {
  try {
    const content = await BexxaContent.findOne().select("isOnline");
    res.json({ isOnline: content?.isOnline ?? true });
  } catch (err) { next(err); }
};

// ── POST /api/bexxa/query ─────────────────────────────────────────────────────

exports.query = async (req, res, next) => {
  try {
    const { query: rawQuery, lat, lng } = req.body;
    if (!rawQuery?.trim()) {
      res.status(400);
      throw new Error("query is required");
    }

    const q      = rawQuery.trim();
    const intent = detectIntent(q);
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    let responseText = "";
    let stations     = [];
    let responseType = intent;

    // ── intent handlers ──────────────────────────────────────────────────────

    if (intent === "amenity_filter") {
      // Determine which facility to filter
      const t = q.toLowerCase();
      let facility = "ev";
      if (/toilet/.test(t))  facility = "toilets";
      else if (/shower/.test(t)) facility = "showers";
      else if (/food/.test(t))   facility = "food";
      else if (/coffee/.test(t)) facility = "coffee";
      else if (/parking/.test(t)) facility = "parking";
      else if (/fuel|petrol|diesel/.test(t)) facility = "fuel";

      const mongoQuery = { facilities: facility };
      if (userLat && userLng) {
        try {
          const raw = await ServiceStation.find({
            location: { $near: { $geometry: { type: "Point", coordinates: [userLng, userLat] }, $maxDistance: 100000 } },
            facilities: facility,
          }).limit(5);
          stations = raw.map(s => formatStation(s, userLat, userLng));
        } catch {
          const raw = await ServiceStation.find(mongoQuery).limit(5);
          stations = raw.map(s => formatStation(s, userLat, userLng));
        }
      } else {
        const raw = await ServiceStation.find(mongoQuery).limit(5);
        stations = raw.map(s => formatStation(s, null, null));
      }
      const label = facility === "ev" ? "EV charging" : facility;
      responseText = stations.length
        ? `I found ${stations.length} station${stations.length !== 1 ? "s" : ""} with ${label}. Here are the closest ones:`
        : `I couldn't find any stations with ${label} in the database right now. Try expanding your search radius.`;
    }

    else if (intent === "operator_search") {
      const t = q.toLowerCase();
      let operator = "";
      if (/shell/.test(t))         operator = "Shell";
      else if (/bp/.test(t))       operator = "BP";
      else if (/esso/.test(t))     operator = "Esso";
      else if (/moto/.test(t))     operator = "Moto";
      else if (/welcome break/.test(t)) operator = "Welcome Break";
      else if (/roadchef/.test(t)) operator = "Roadchef";
      else if (/extra/.test(t))    operator = "Extra";

      const mongoQuery = operator ? { operator: new RegExp(operator, "i") } : {};
      const raw = await ServiceStation.find(mongoQuery).limit(5);
      stations = raw.map(s => formatStation(s, userLat, userLng));
      responseText = stations.length
        ? `Here are ${operator || "matching"} stations I found:`
        : `I couldn't find any ${operator || "matching"} stations right now.`;
    }

    else if (intent === "junction_lookup") {
      const jMatch = q.match(/j(?:unction)?\s*(\d+[a-z]?)/i);
      const jNum   = jMatch ? jMatch[1].toUpperCase() : null;
      const raw = jNum
        ? await ServiceStation.find({ $or: [{ address: new RegExp(`J${jNum}`, "i") }, { motorway: new RegExp(jNum, "i") }] }).limit(5)
        : await ServiceStation.find({}).limit(5);
      stations = raw.map(s => formatStation(s, userLat, userLng));
      responseText = stations.length
        ? `Here's what I found near junction ${jNum || "that area"}:`
        : `I couldn't find specific station data for that junction. Try browsing the Nearby page.`;
    }

    else if (intent === "open_24_7") {
      const raw = await ServiceStation.find({ openNow: true }).limit(5);
      stations = raw.map(s => formatStation(s, userLat, userLng));
      responseText = stations.length
        ? `Here are stations that are open 24/7:`
        : `I don't have live opening hours right now, but most motorway service stations operate 24/7. Check the Nearby page for details.`;
    }

    else if (intent === "nearby" && userLat && userLng) {
      try {
        const raw = await ServiceStation.find({
          location: { $near: { $geometry: { type: "Point", coordinates: [userLng, userLat] }, $maxDistance: 50000 } },
        }).limit(5);
        stations = raw.map(s => formatStation(s, userLat, userLng));
        responseText = stations.length
          ? `Here are the nearest stations to your location:`
          : `No stations found nearby. Try the Nearby page with a larger radius.`;
      } catch {
        responseText = "I need your location to find nearby stations. Please allow location access and try again.";
      }
    }

    else {
      responseText = "I can help you find motorway service stations! Try asking things like:\n• \"Find the nearest Shell station\"\n• \"Show stations with EV charging\"\n• \"What's at junction 15?\"\n• \"Stations open 24/7 near me\"";
      responseType = "general_help";
    }

    // ── log interaction ──────────────────────────────────────────────────────
    await BexxaInteraction.create({
      user:     req.user?._id || null,
      query:    q,
      response: responseText,
      metadata: { intent, stationCount: stations.length },
    }).catch(() => {}); // non-blocking

    res.json({ response: responseText, responseType, stations });
  } catch (err) { next(err); }
};

// ── POST /api/bexxa/interactions ──────────────────────────────────────────────

exports.logInteraction = async (req, res, next) => {
  try {
    const { query, response, sourcePage, metadata } = req.body;
    if (!query) { res.status(400); throw new Error("query is required"); }
    const doc = await BexxaInteraction.create({
      user: req.user?._id || null,
      query, response: response || "", sourcePage: sourcePage || "bexxa-assistant",
      metadata: metadata || {},
    });
    res.status(201).json(doc);
  } catch (err) { next(err); }
};
