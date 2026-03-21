const crypto       = require("crypto");
const GuestSession = require("../models/GuestSession");

const CAPABILITIES = ["browse", "view_details", "navigate", "view_reviews"];

// ── GET /api/guest-access/page-data ──────────────────────────────────────────
exports.getPageData = (req, res) => {
  res.json({
    hero: {
      badge:    "No Account Required",
      title:    "Guest Access",
      subtitle: "Explore QuickBreak without creating an account. Browse stations, view details, and plan your journey instantly.",
    },
    guestFeatures:    ["Browse nearby stations", "View station details", "Use navigation", "View reviews"],
    guestRestrictions:["Save stations", "Post reviews", "Create reports", "Sync preferences"],
    fullAccountFeatures: ["Browse nearby stations", "View station details", "Use navigation", "View reviews", "Save stations", "Post reviews", "Create reports", "Sync preferences"],
    extraBenefits: ["Personalised station recommendations", "Access saved stations on any device", "Contribute to the QuickBreak community"],
    quickStartCards: [
      { title: "Browse Instantly",  description: "No sign-up required. Start exploring stations right away.",          iconKey: "eye" },
      { title: "Find Stations",     description: "Search by location, amenities, or motorway junction.",               iconKey: "pin" },
      { title: "Navigate There",    description: "Get directions and hit the road in just one tap.",                   iconKey: "navigate" },
    ],
    cta: {
      title: "Ready for More?",
      text:  "Create a free account to unlock saved stations, post reviews, and get personalised recommendations.",
    },
  });
};

// ── POST /api/guest-access/start ─────────────────────────────────────────────
exports.startSession = async (req, res, next) => {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const session = await GuestSession.create({
      sessionToken: token,
      sourcePage:   req.body.sourcePage || "guest-access",
    });
    res.status(201).json({
      sessionToken: session.sessionToken,
      role:         "guest",
      capabilities: CAPABILITIES,
      expiresAt:    session.expiresAt,
    });
  } catch (err) { next(err); }
};

// ── GET /api/guest-access/session ────────────────────────────────────────────
exports.getSession = async (req, res, next) => {
  try {
    const token = req.headers["x-guest-token"] || req.query.token;
    if (!token) return res.json({ active: false });

    const session = await GuestSession.findOne({ sessionToken: token, isActive: true });
    if (!session || session.expiresAt < new Date()) {
      return res.json({ active: false });
    }

    // bump lastActiveAt
    session.lastActiveAt = new Date();
    await session.save();

    res.json({ active: true, role: "guest", capabilities: session.capabilities, expiresAt: session.expiresAt });
  } catch (err) { next(err); }
};

// ── POST /api/guest-access/end ───────────────────────────────────────────────
exports.endSession = async (req, res, next) => {
  try {
    const token = req.headers["x-guest-token"] || req.body.token;
    if (token) await GuestSession.updateOne({ sessionToken: token }, { isActive: false });
    res.json({ ended: true });
  } catch (err) { next(err); }
};
