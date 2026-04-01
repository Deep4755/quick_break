const {
  getDirections,
  reverseGeocode,
  forwardGeocode,
} = require("../services/mapboxService");

const tomtomService = require("../services/tomtomService");

// GET /api/map/directions?fromLng=&fromLat=&toLng=&toLat=
exports.directions = async (req, res, next) => {
  try {
    const { fromLng, fromLat, toLng, toLat } = req.query;

    if (!fromLng || !fromLat || !toLng || !toLat) {
      res.status(400);
      throw new Error("fromLng, fromLat, toLng, toLat are required");
    }

    const data = await getDirections({
      fromLng: Number(fromLng),
      fromLat: Number(fromLat),
      toLng: Number(toLng),
      toLat: Number(toLat),
    });

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/map/route?fromLat=&fromLng=&toLat=&toLng= (TomTom routing)
exports.route = async (req, res, next) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    if (!fromLat || !fromLng || !toLat || !toLng) {
      res.status(400);
      throw new Error("fromLat, fromLng, toLat, toLng are required");
    }

    const data = await tomtomService.calculateRoute({
      fromLat: Number(fromLat),
      fromLng: Number(fromLng),
      toLat: Number(toLat),
      toLng: Number(toLng),
    });

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/map/reverse?lng=&lat=
exports.reverse = async (req, res, next) => {
  try {
    const { lng, lat } = req.query;

    if (!lng || !lat) {
      res.status(400);
      throw new Error("lng and lat are required");
    }

    const data = await reverseGeocode({ lng: Number(lng), lat: Number(lat) });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/map/forward?query=Heathrow
exports.forward = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      res.status(400);
      throw new Error("query is required");
    }

    const data = await forwardGeocode({ query });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/map/search-location?q=Iver (TomTom fuzzy search)
exports.searchLocation = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) { res.status(400); throw new Error("q (query) is required"); }
    const data = await tomtomService.searchLocation(q);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/map/reverse-geocode?lat=&lng= (TomTom reverse geocoding)
exports.reverseGeocodeTomTom = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400);
      throw new Error("lat and lng are required");
    }

    const data = await tomtomService.reverseGeocode({ 
      lat: Number(lat), 
      lng: Number(lng) 
    });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};
