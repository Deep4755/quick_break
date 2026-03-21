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

// ── 3. Locate the built React frontend ───────────────────────────────────────
// Log exact runtime paths so we can debug from Hostinger runtime logs
console.log('📂 process.cwd()  :', process.cwd());
console.log('📂 __dirname      :', __dirname);

const candidates = [
  path.resolve(__dirname, '..', '..', 'FRONTEND', 'dist'),  // full repo: BACKEND/src → root → FRONTEND/dist
  path.resolve(__dirname, '..', 'public'),                   // BACKEND/public
  path.resolve(process.cwd(), 'FRONTEND', 'dist'),           // if cwd = repo root
  path.resolve(process.cwd(), '..', 'FRONTEND', 'dist'),     // if cwd = BACKEND
];

let distDir = null;
for (const candidate of candidates) {
  if (fs.existsSync(path.join(candidate, 'index.html'))) {
    distDir = candidate;
    break;
  }
}

// Log all candidates so you can see in Hostinger runtime logs exactly what's happening
console.log('🔍 Searching for frontend build...');
candidates.forEach(c => {
  console.log(`   ${c} → ${fs.existsSync(path.join(c, 'index.html')) ? '✅ FOUND' : '❌ not found'}`);
});

if (distDir) {
  console.log('✅ Serving frontend from:', distDir);
  app.use(express.static(distDir));

  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  console.error('❌ Frontend build not found in any candidate path.');
  console.error('   Make sure FRONTEND/dist exists in the repo or run the build command.');

  app.get('*', (req, res) => {
    res.status(503).json({
      message: 'Frontend build not found.',
      searched: candidates,
    });
  });
}

// ── 4. Error handler — must be last ──────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
