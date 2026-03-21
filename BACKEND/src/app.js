const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const mapRoutes             = require("./routes/mapRoutes");
const authRoutes            = require("./routes/authRoutes");
const healthRoutes          = require('./routes/healthRoutes');
const serviceStationRoutes  = require('./routes/serviceStationRoutes');
const reportRoutes          = require('./routes/reportRoutes');
const savedStationRoutes    = require('./routes/savedStationRoutes');
const bexxaRoutes           = require('./routes/bexxaRoutes');
const reviewRoutes          = require('./routes/reviewRoutes');
const guestAccessRoutes     = require('./routes/guestAccessRoutes');
const helpCenterRoutes      = require('./routes/helpCenterRoutes');
const contactRoutes         = require('./routes/contactRoutes');
const legalRoutes           = require('./routes/legalRoutes');

const notFound     = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security & logging ────────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:5173", "http://localhost:3000", "http://localhost:5000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);                          // same-origin / Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV === "production") return callback(null, true); // single-app mode
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

// ── API routes (must come before static serving) ──────────────────────────────
app.use('/api/health',            healthRoutes);
app.use('/api/service-stations',  serviceStationRoutes);
app.use('/api/reports',           reportRoutes);
app.use('/api/saved-stations',    savedStationRoutes);
app.use('/api/bexxa',             bexxaRoutes);
app.use('/api/reviews',           reviewRoutes);
app.use('/api/guest-access',      guestAccessRoutes);
app.use('/api/help-center',       helpCenterRoutes);
app.use('/api/contact',           contactRoutes);
app.use('/api/legal',             legalRoutes);
app.use('/api/map',               mapRoutes);
app.use('/api/auth',              authRoutes);

// ── API 404 — only fires for unmatched /api/* routes ─────────────────────────
app.use('/api/*', notFound);

// ── Production: serve React build ────────────────────────────────────────────
// __dirname = BACKEND/src
// FRONTEND/dist is at: project-root/FRONTEND/dist
// path: BACKEND/src → ../../ → project-root → FRONTEND/dist
const clientBuildPath = path.resolve(__dirname, '..', '..', 'FRONTEND', 'dist');
const indexPath       = path.join(clientBuildPath, 'index.html');

if (process.env.NODE_ENV === 'production') {
  console.log('📁 Serving frontend from:', clientBuildPath);

  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(clientBuildPath));

  // SPA fallback — send index.html for every non-API route so React Router works
  app.get('*', (req, res) => {
    res.sendFile(indexPath);
  });
}

// ── Error handler (API errors only — frontend routes never reach here) ────────
app.use(errorHandler);

module.exports = app;
