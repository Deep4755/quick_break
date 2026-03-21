const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  key:     { type: String, required: true },
  title:   { type: String, required: true },
  order:   { type: Number, default: 0 },
  // blocks: array of { type, content }
  // type: "paragraph" | "bullets" | "infoCards" | "rightsBox" | "contactBox"
  blocks:  { type: mongoose.Schema.Types.Mixed, default: [] },
}, { _id: false });

const legalDocumentSchema = new mongoose.Schema(
  {
    slug:        { type: String, required: true, unique: true, index: true },
    title:       { type: String, required: true },
    subtitle:    { type: String, default: "" },
    badgeLabel:  { type: String, default: "Legal Document" },
    lastUpdated: { type: Date, required: true },
    sections:    { type: [sectionSchema], default: [] },
    contactBox:  {
      teamName:     { type: String, default: "" },
      email:        { type: String, default: "" },
      supportEmail: { type: String, default: "" },
      responseTime: { type: String, default: "" },
    },
    acknowledgementText: { type: String, default: "" },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LegalDocument", legalDocumentSchema);
