const mongoose = require("mongoose");

const savedStationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stationId: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, default: "" },
    motorway: { type: String, default: "" },
    roadLabel: { type: String, default: "" },
    address: { type: String, default: "" },
    distanceKm: { type: Number, default: null },
    amenities: [{ type: String }],
    note: { type: String, default: "" },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    image: { type: String, default: "" },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Prevent duplicate saves for same user + station
savedStationSchema.index({ user: 1, stationId: 1 }, { unique: true });

module.exports = mongoose.model("SavedStation", savedStationSchema);
