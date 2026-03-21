const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    fullName:   { type: String, required: true, trim: true },
    email:      { type: String, required: true, trim: true, lowercase: true },
    subject:    { type: String, required: true, trim: true },
    message:    { type: String, required: true, trim: true },
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isGuest:    { type: Boolean, default: false },
    status:     { type: String, enum: ["new", "read", "replied"], default: "new" },
    sourcePage: { type: String, default: "contact" },
    metadata:   {
      authState: { type: String, enum: ["authenticated", "guest", "public"], default: "public" },
      userAgent: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
