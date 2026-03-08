const axios = require("axios");

const GOOGLE_BASE_NEARBY = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const GOOGLE_BASE_FIND = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json";
const GOOGLE_BASE_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";
const GOOGLE_BASE_PHOTO = "https://maps.googleapis.com/maps/api/place/photo";

async function nearbySearch({ lat, lng, radiusMeters = 100, keyword }) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY missing in .env");

  const res = await axios.get(GOOGLE_BASE_NEARBY, {
    params: {
      key,
      location: `${lat},${lng}`,
      radius: radiusMeters,
      keyword,
    },
  });

  return res.data;
}

async function findPlaceIdByText({ text, lat, lng, radiusMeters = 100 }) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY missing in .env");

  // Use Find Place from text as a fallback; bias by location via locationbias=point:lat,lng
  const params = {
    key,
    input: text,
    inputtype: "textquery",
  };

  // location bias
  if (lat && lng) params.locationbias = `point:${lat},${lng}`;

  const res = await axios.get(GOOGLE_BASE_FIND, { params });
  return res.data;
}

async function getPlaceDetails(placeId, fields = []) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY missing in .env");

  const res = await axios.get(GOOGLE_BASE_DETAILS, {
    params: {
      key,
      place_id: placeId,
      fields: fields.join(","),
    },
  });

  return res.data;
}

function buildPhotoUrl(photoReference, maxwidth = 800) {
  const key = process.env.GOOGLE_API_KEY;
  if (!photoReference || !key) return null;
  return `${GOOGLE_BASE_PHOTO}?maxwidth=${maxwidth}&photoreference=${photoReference}&key=${key}`;
}

// Find place id by nearby search first, falling back to findPlaceByText
async function findPlaceDetails({ lat, lng, name, radiusMeters = 100 }) {
  try {
    const nearby = await nearbySearch({ lat, lng, radiusMeters, keyword: name });
    let candidates = nearby?.results || [];

    // If nearby didn't return, try findPlaceByText
    if (!candidates.length) {
      const found = await findPlaceIdByText({ text: name, lat, lng, radiusMeters });
      const foundCandidates = found?.candidates || [];
      candidates = foundCandidates.map((c) => ({ place_id: c.place_id, ...c }));
    }

    if (!candidates.length) return null;

    const place = candidates[0];
    const placeId = place.place_id || place.placeId || null;
    if (!placeId) return null;

    const fields = ["rating", "opening_hours", "types", "photos", "user_ratings_total"];
    const detailsRes = await getPlaceDetails(placeId, fields);
    const details = detailsRes?.result || null;
    if (!details) return null;

    const photoRef = details.photos?.[0]?.photo_reference || null;
    const photoUrl = photoRef ? buildPhotoUrl(photoRef, 800) : null;

    return {
      placeId,
      rating: details.rating ?? null,
      user_ratings_total: details.user_ratings_total ?? null,
      open_now: details.opening_hours?.open_now ?? null,
      types: details.types ?? [],
      photoUrl,
    };
  } catch (e) {
    return null;
  }
}

module.exports = {
  nearbySearch,
  findPlaceDetails,
};
