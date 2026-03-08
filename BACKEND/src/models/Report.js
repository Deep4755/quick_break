const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceStation",
      required: true,
    },

    cleanlinessRating: { type: Number, min: 1, max: 5, required: true },

    busyLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    parkingStatus: {
      type: String,
      enum: ["Available", "Limited", "Full"],
      required: true,
    },

    evStatus: {
      type: String,
      enum: ["Working", "SomeBroken", "OutOfOrder", "NoEV"],
      default: "NoEV",
    },

    comment: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
