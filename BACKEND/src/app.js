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
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://api.tomtom.com", "https://fonts.googleapis.com"],
      styleSrc:       ["'self'", "'unsafe-inline'", "https://api.tomtom.com", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      fontSrc:        ["'self'", "https://fonts.gstatic.com", "https://api.tomtom.com"],
      imgSrc:         ["'self'", "data:", "blob:", "https://api.tomtom.com", "https://*.tomtom.com"],
      connectSrc:     ["'self'", "https://api.tomtom.com", "https://*.tomtom.com"],
      workerSrc:      ["'self'", "blob:"],
      childSrc:       ["blob:"],
    },
  },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [
      'http://localhost:5173', 
      'http://localhost:3000', 
      'http://localhost:5000'
    ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow requests with no origin (mobile apps, etc.)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV === 'production') return callback(null, true); // Allow all origins in production for single deployment
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
const publicDir = path.join(__dirname, '..', 'public');
const clientIndex = path.join(publicDir, 'index.html');

console.log('📁 Serving frontend from:', publicDir);
console.log('📄 index.html exists:', fs.existsSync(clientIndex));

app.use(express.static(publicDir));

// ── 4. SPA fallback — send index.html for all non-API routes ─────────────────
// Handle root route
app.get('/', (req, res) => {
  if (fs.existsSync(clientIndex)) {
    return res.sendFile(clientIndex);
  }
  
  console.error('❌ Frontend build not found at:', clientIndex);
  return res.status(503).json({
    message: 'Frontend build not found. Please build the frontend first.',
    lookedFor: clientIndex
  });
});

// Handle all other non-API routes for SPA
app.use((req, res, next) => {
  // Skip if it's an API route (already handled above)
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Skip if it's a static file request
  if (req.path.includes('.')) {
    return next();
  }
  
  if (fs.existsSync(clientIndex)) {
    return res.sendFile(clientIndex);
  }
  
  console.error('❌ Frontend build not found at:', clientIndex);
  return res.status(503).json({
    message: 'Frontend build not found. Please build the frontend first.',
    lookedFor: clientIndex
  });
});

// ── 5. Error handler — must be last ──────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
