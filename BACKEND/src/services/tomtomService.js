const axios = require("axios");

const TOMTOM_BASE = "https://api.tomtom.com/search/2";
const TOMTOM_ROUTING_BASE = "https://api.tomtom.com/routing/1";

// Search nearby service stations
exports.searchNearbyServices = async ({ lat, lng, radiusKm = 10, limit = 20 }) => {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY missing in .env");

  const radiusMeters = Math.round(Number(radiusKm) * 1000);
  const query = "service station";

  const url = `${TOMTOM_BASE}/search/${encodeURIComponent(query)}.json`;

  const res = await axios.get(url, {
    params: {
      key,
      lat,
      lon: lng,
      radius: radiusMeters,
      limit,
      language: "en-GB",
    },
  });

  return res.data;
};

// Get route between two points — returns up to 3 route alternatives
exports.calculateRoute = async ({ fromLat, fromLng, toLat, toLng }) => {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY missing in .env");

  const url = `${TOMTOM_ROUTING_BASE}/calculateRoute/${fromLat},${fromLng}:${toLat},${toLng}/json`;

  const res = await axios.get(url, {
    params: {
      key,
      routeType: "fastest",
      traffic: "true",
      language: "en-GB",
      instructionsType: "text",
      routeRepresentation: "polyline",
      computeTravelTimeFor: "all",
      maxAlternatives: 2,          // ask for up to 2 alternatives
      alternativeType: "anyRoute",
    },
  });

  const routes = res.data.routes || [];
  if (!routes.length) throw new Error("No route found");

  const parsed = routes.map((route, idx) => {
    const allPoints = (route.legs || []).flatMap(leg => leg.points || []);
    // Extract road names from guidance instructions for "via" label
    const instructions = (route.guidance?.instructions || []);
    const roadNames = [...new Set(
      instructions
        .map(i => i.roadNumbers?.[0] || i.street)
        .filter(Boolean)
        .slice(0, 3)
    )];
    const viaLabel = roadNames.length ? roadNames.join(", ") : (idx === 0 ? "Fastest route" : `Route ${idx + 1}`);

    // Extract turn-by-turn steps (first 6 meaningful ones)
    const steps = instructions
      .filter(i => i.message && i.message.trim())
      .slice(0, 6)
      .map(i => ({
        message: i.message,
        roadNumber: i.roadNumbers?.[0] || null,
        maneuver: i.maneuver || null,
      }));

    return {
      index: idx,
      distanceMeters: route.summary.lengthInMeters,
      durationSeconds: route.summary.travelTimeInSeconds,
      trafficDelaySeconds: route.summary.trafficDelayInSeconds || 0,
      viaLabel,
      isFastest: idx === 0,
      geometry: allPoints,   // [{ latitude, longitude }, ...]
      steps,
    };
  });

  return { routes: parsed };
};

// Reverse geocoding - coordinates to address
exports.reverseGeocode = async ({ lat, lng }) => {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY missing in .env");

  const url = `${TOMTOM_BASE}/reverseGeocode/${lat},${lng}.json`;

  const res = await axios.get(url, {
    params: {
      key,
      language: "en-GB"
    },
  });

  return res.data;
};

// Search location — fuzzy search for places, POIs, postcodes (UK)
exports.searchLocation = async (query) => {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY missing in .env");

  const url = `${TOMTOM_BASE}/search/${encodeURIComponent(query)}.json`;

  const res = await axios.get(url, {
    params: {
      key,
      limit: 8,
      countrySet: "GB",
      language: "en-GB",
      typeahead: true,
      idxSet: "Geo,PAD,Addr,POI",  // geography + addresses + POIs
    },
  });

  return res.data;
};

// Forward geocoding — address/place to coordinates (UK only)
exports.forwardGeocode = async (query) => {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY missing in .env");

  const url = `${TOMTOM_BASE}/geocode/${encodeURIComponent(query)}.json`;

  const res = await axios.get(url, {
    params: {
      key,
      limit: 8,
      countrySet: "GB",
      language: "en-GB",
    },
  });

  return res.data;
};