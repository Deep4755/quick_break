const SavedStation = require("../models/SavedStation");

// POST /api/saved-stations — save a station
exports.saveStation = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorised. Please log in.");
    }

    const { stationId, name, brand, motorway, roadLabel, address, distanceKm, amenities, note, coordinates, image } = req.body;

    if (!stationId || !name) {
      res.status(400);
      throw new Error("stationId and name are required");
    }

    const saved = await SavedStation.create({
      user: req.user._id,
      stationId,
      name,
      brand: brand || "",
      motorway: motorway || "",
      roadLabel: roadLabel || "",
      address: address || "",
      distanceKm: distanceKm ?? null,
      amenities: amenities || [],
      note: note || "",
      coordinates: coordinates || { lat: null, lng: null },
      image: image || "",
    });

    res.status(201).json({ message: "Station saved successfully", saved });
  } catch (err) {
    // Duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ message: "Station already saved" });
    }
    next(err);
  }
};

// GET /api/saved-stations — get all saved stations for current user
exports.getSavedStations = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorised. Please log in.");
    }

    const stations = await SavedStation.find({ user: req.user._id }).sort({ savedAt: -1 });
    res.json(stations);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/saved-stations/:stationId — remove a saved station
exports.removeSavedStation = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorised. Please log in.");
    }

    const { stationId } = req.params;
    const result = await SavedStation.findOneAndDelete({ user: req.user._id, stationId });

    if (!result) {
      res.status(404);
      throw new Error("Saved station not found");
    }

    res.json({ message: "Station removed from saved stations" });
  } catch (err) {
    next(err);
  }
};

// GET /api/saved-stations/check/:stationId — check if station is saved
exports.checkSaved = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.json({ saved: false });
    }

    const { stationId } = req.params;
    const exists = await SavedStation.exists({ user: req.user._id, stationId });
    res.json({ saved: !!exists });
  } catch (err) {
    next(err);
  }
};

// GET /api/saved-stations/check-bulk?stationIds=id1,id2,id3
exports.checkBulk = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.json({ saved: {} });
    }

    const ids = (req.query.stationIds || "").split(",").map(s => s.trim()).filter(Boolean);
    if (!ids.length) return res.json({ saved: {} });

    const found = await SavedStation.find(
      { user: req.user._id, stationId: { $in: ids } },
      { stationId: 1 }
    );

    const savedMap = {};
    ids.forEach(id => { savedMap[id] = false; });
    found.forEach(doc => { savedMap[doc.stationId] = true; });

    res.json({ saved: savedMap });
  } catch (err) {
    next(err);
  }
};
