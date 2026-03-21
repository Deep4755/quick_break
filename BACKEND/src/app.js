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

// ── 2. API 404 — unmatched /api/* return JSON ─────────────────────────────────
app.use('/api/{*splat}', notFound);

// ── 3. Frontend static files ──────────────────────────────────────────────────
// Vite builds into BACKEND/public (configured in vite.config.js)
// __dirname = BACKEND/src  →  ../public = BACKEND/public
const publicDir   = path.join(__dirname, '..', 'public');
const clientIndex = path.join(publicDir, 'index.html');

const frontendExists = fs.existsSync(clientIndex);
console.log('📁 Frontend public dir:', publicDir);
console.log('📄 index.html found:', frontendExists);

if (frontendExists) {
  app.use(express.static(publicDir));

  // ── 4. SPA fallback — React Router needs this for direct URL access ─────────
  app.get('/{*splat}', (req, res) => {
    res.sendFile(clientIndex);
  });
} else {
  console.warn('⚠️  BACKEND/public/index.html not found — frontend not served');
  console.warn('   Run: npm run build (from BACKEND) to build the frontend');

  // Return a clear message instead of crashing
  app.get('/{*splat}', (req, res) => {
    res.status(503).json({
      message: 'Frontend not built yet. Run: npm run build from BACKEND folder.',
    });
  });
}

// ── 5. Error handler — must be last ──────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
