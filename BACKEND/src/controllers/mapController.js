const {
  getDirections,
  reverseGeocode,
  forwardGeocode,
} = require("../services/mapboxService");

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
