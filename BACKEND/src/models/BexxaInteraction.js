const mongoose = require("mongoose");

const bexxaInteractionSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  query:      { type: String, required: true },
  response:   { type: String, default: "" },
  sourcePage: { type: String, default: "bexxa-assistant" },
  metadata:   { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model("BexxaInteraction", bexxaInteractionSchema);
