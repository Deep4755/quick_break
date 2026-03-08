const axios = require("axios");

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
const PROFILE = process.env.MAPBOX_PROFILE || "driving";

if (!MAPBOX_TOKEN) {
  console.warn("⚠️ MAPBOX_TOKEN is missing in .env");
}

// 1) Directions: from -> to (lng,lat)
exports.getDirections = async ({ fromLng, fromLat, toLng, toLat }) => {
  const url = `https://api.mapbox.com/directions/v5/mapbox/${PROFILE}/${fromLng},${fromLat};${toLng},${toLat}`;

  const res = await axios.get(url, {
    params: {
      access_token: MAPBOX_TOKEN,
      geometries: "geojson",
      overview: "full",
      steps: true,
    },
  });

  // Mapbox response
  const route = res.data.routes?.[0];
  if (!route) throw new Error("No route found from Mapbox");

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry, // GeoJSON line
    legs: route.legs,
  };
};

// 2) Reverse geocode: lng,lat -> address
exports.reverseGeocode = async ({ lng, lat }) => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;

  const res = await axios.get(url, {
    params: {
      access_token: MAPBOX_TOKEN,
      limit: 1,
    },
  });

  const place = res.data.features?.[0];
  return place
    ? { place_name: place.place_name, coordinates: place.center }
    : { place_name: null, coordinates: [lng, lat] };
};

// 3) Forward geocode: text -> lng,lat
exports.forwardGeocode = async ({ query }) => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;

  const res = await axios.get(url, {
    params: {
      access_token: MAPBOX_TOKEN,
      limit: 1,
    },
  });

  const place = res.data.features?.[0];
  if (!place) return null;

  return {
    place_name: place.place_name,
    coordinates: place.center, // [lng,lat]
  };
};
