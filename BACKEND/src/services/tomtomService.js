const axios = require("axios");

const TOMTOM_BASE = "https://api.tomtom.com/search/2";

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
// Note: TomTom is used only for geospatial search in this project.