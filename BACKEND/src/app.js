const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const helmet     = require('helmet');
const path       = require('path');
const fs         = require('fs');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes           = require('./routes/authRoutes');
const healthRoutes         = require('./routes/healthRoutes');
const serviceStationRoutes = require('./routes/serviceStationRoutes');
const reportRoutes         = require('./routes/reportRoutes');
const savedStationRoutes   = require('./routes/savedStationRoutes');
const bexxaRoutes          = require('./routes/bexxaRoutes');
const reviewRoutes         = require('./routes/reviewRoutes');
const guestAccessRoutes    = require('./routes/guestAccessRoutes');
const helpCenterRoutes     = require('./routes/helpCenterRoutes');
const contactRoutes        = require('./routes/contactRoutes');
const legalRoutes          = require('./routes/legalRoutes');
const mapRoutes            = require('./routes/mapRoutes');

const notFound     = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV === 'production') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Logging & body parsing ────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// ── 1. API routes — always first ─────────────────────────────────────────────
app.use('/api/health',           healthRoutes);
app.use('/api/auth',             authRoutes);
app.use('/api/service-stations', serviceStationRoutes);
app.use('/api/reports',          reportRoutes);
app.use('/api/saved-stations',   savedStationRoutes);
app.use('/api/bexxa',            bexxaRoutes);
app.use('/api/reviews',          reviewRoutes);
app.use('/api/guest-access',     guestAccessRoutes);
app.use('/api/help-center',      helpCenterRoutes);
app.use('/api/contact',          contactRoutes);
app.use('/api/legal',            legalRoutes);
app.use('/api/map',              mapRoutes);

// ── 2. API 404 — unmatched /api/* routes return JSON ─────────────────────────
app.use('/api', notFound);

// ── 3. Serve React frontend ───────────────────────────────────────────────────
// Try multiple possible paths for frontend files (local vs Hostinger)
let publicDir;
let clientIndex;

// Option 1: Standard path (local development)
const standardPath = path.join(__dirname, "..", "public");
// Option 2: Alternative path (some hosting providers)
const altPath = path.join(__dirname, "public");
// Option 3: Root level path
const rootPath = path.join(process.cwd(), "public");

if (fs.existsSync(path.join(standardPath, "index.html"))) {
  publicDir = standardPath;
} else if (fs.existsSync(path.join(altPath, "index.html"))) {
  publicDir = altPath;
} else if (fs.existsSync(path.join(rootPath, "index.html"))) {
  publicDir = rootPath;
} else {
  publicDir = standardPath; // fallback
}

clientIndex = path.join(publicDir, "index.html");

console.log("🔧 __dirname:", __dirname);
console.log("🔧 process.cwd():", process.cwd());
console.log("📁 Trying paths:");
console.log("   Standard:", standardPath, "exists:", fs.existsSync(path.join(standardPath, "index.html")));
console.log("   Alt:", altPath, "exists:", fs.existsSync(path.join(altPath, "index.html")));
console.log("   Root:", rootPath, "exists:", fs.existsSync(path.join(rootPath, "index.html")));
console.log("📁 Selected frontend path:", publicDir);
console.log("📄 index.html path:", clientIndex);
console.log("📄 index.html exists:", fs.existsSync(clientIndex));

app.use(express.static(publicDir));

app.get("*", (req, res) => {
  console.log("🌐 SPA fallback for:", req.path);
  
  if (fs.existsSync(clientIndex)) {
    console.log("✅ Sending index.html from:", clientIndex);
    return res.sendFile(clientIndex);
  }

  console.error("❌ Could not find index.html at:", clientIndex);
  console.error("❌ Directory contents:", fs.readdirSync(publicDir).join(", "));
  
  return res.status(503).json({
    message: "Frontend build not found.",
    lookedFor: clientIndex,
    publicDir: publicDir,
    dirExists: fs.existsSync(publicDir),
    dirContents: fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : "Directory not found"
  });
});

// ── 5. Error handler — must be last ──────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
