const mongoose = require("mongoose");

const stationReviewSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestName:   { type: String, trim: true, default: "" },
    stationId:   { type: String, required: true, trim: true },
    stationName: { type: String, required: true, trim: true },
    brand:       { type: String, trim: true, default: "" },
    roadLabel:   { type: String, trim: true, default: "" },
    address:     { type: String, trim: true, default: "" },
    rating:      { type: Number, required: true, min: 1, max: 5 },
    title:       { type: String, required: true, trim: true, maxlength: 120 },
    reviewText:  { type: String, required: true, trim: true, maxlength: 1000 },
    tags:        [{ type: String, trim: true }],
    helpfulCount: { type: Number, default: 0 },
    helpfulBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isApproved:  { type: Boolean, default: true },
    isEdited:    { type: Boolean, default: false },
    amenitiesSnapshot: [{ type: String }],
    source:      { type: String, default: "reviews-page" },
  },
  { timestamps: true }
);

// Index for fast station lookups and text search
stationReviewSchema.index({ stationId: 1 });
stationReviewSchema.index({ brand: 1 });
stationReviewSchema.index({ rating: -1 });
stationReviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model("StationReview", stationReviewSchema);
