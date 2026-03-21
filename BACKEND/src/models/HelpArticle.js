const mongoose = require("mongoose");

const helpArticleSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true },
    slug:         { type: String, required: true, unique: true, index: true },
    category:     { type: String, required: true, index: true },
    summary:      { type: String, default: "" },
    content:      { type: String, required: true },
    keywords:     { type: [String], default: [] },
    isFaq:        { type: Boolean, default: false },
    faqOrder:     { type: Number, default: 99 },
    isPublished:  { type: Boolean, default: true },
    relatedRoutes:{ type: [String], default: [] },
  },
  { timestamps: true }
);

// text index for search
helpArticleSchema.index({ title: "text", summary: "text", content: "text", keywords: "text" });

module.exports = mongoose.model("HelpArticle", helpArticleSchema);
