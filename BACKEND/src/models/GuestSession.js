const mongoose = require("mongoose");

const guestSessionSchema = new mongoose.Schema(
  {
    sessionToken: { type: String, required: true, unique: true, index: true },
    role:         { type: String, default: "guest" },
    capabilities: { type: [String], default: ["browse","view_details","navigate","view_reviews"] },
    sourcePage:   { type: String, default: "guest-access" },
    isActive:     { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt:    { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 days
  },
  { timestamps: true }
);

module.exports = mongoose.model("GuestSession", guestSessionSchema);
