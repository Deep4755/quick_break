const mongoose = require("mongoose");

const serviceStationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    motorway: { type: String, trim: true }, // e.g., M4, M25

    operator: { type: String, trim: true },
    tomtomId: {
  type: String,
  unique: true,
  sparse: true, // allows null for manual stations
}, // optional: Moto, Welcome Break etc.

    // GeoJSON for location-based searching (nearby)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat] (IMPORTANT: longitude first)
        required: true,
      },
    },

    address: { type: String, trim: true },

    facilities: [
      {
        type: String,
        trim: true,
        // Example: "fuel", "food", "toilets", "ev", "parking", "coffee"
      },
    ],

    // Google Places enrichment fields
    googlePlaceId: { type: String, trim: true, default: null },
    rating: { type: Number, default: null },
    userRatingsTotal: { type: Number, default: null },
    openNow: { type: Boolean, default: null },
    photoUrl: { type: String, trim: true, default: null },
    types: [
      {
        type: String,
        trim: true,
      },
    ],

    // Aggregated values (updated when reports are added)
    avgCleanliness: { type: Number, default: 0 }, // 0–5
    avgBusyLevel: { type: Number, default: 0 },   // 0–3 (optional scale)
    lastStatus: {
      parkingStatus: {
        type: String,
        default: null,
      },
      evStatus: {
        type: String,
        default: null,
      },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Geospatial index for "nearby" queries
serviceStationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("ServiceStation", serviceStationSchema);
