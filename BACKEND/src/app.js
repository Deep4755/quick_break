const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mapRoutes = require("./routes/mapRoutes");
const authRoutes = require("./routes/authRoutes");



const healthRoutes = require('./routes/healthRoutes');
const serviceStationRoutes = require('./routes/serviceStationRoutes');
const reportRoutes = require('./routes/reportRoutes');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // allow fonts/images from external CDNs
}));

// CORS — in production (single-app), frontend is served by same Express server
// so CORS is only needed for local dev. We keep it permissive for demo safety.
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:5173", "http://localhost:3000", "http://localhost:5000"];

app.use(cors({
  origin: (origin, callback) => {
    // No origin = same-origin request (production) or tools like Postman — always allow
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In production single-app mode, all requests come from same origin — no CORS needed
    if (process.env.NODE_ENV === "production") return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/service-stations', serviceStationRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/auth", authRoutes);


// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Serve frontend build in production
const path = require("path");
if (process.env.NODE_ENV === "production") {
  // Primary path: FRONTEND/dist is a sibling of BACKEND (monorepo structure)
  const clientBuildPath = path.join(__dirname, "..", "..", "FRONTEND", "dist");
  const indexPath = path.join(clientBuildPath, "index.html");

  app.use(express.static(clientBuildPath));

  // SPA fallback — React Router needs this so /nearby, /login etc. work on refresh
  app.get("*", (req, res) => {
    res.sendFile(indexPath);
  });

  console.log("📁 Serving frontend from:", clientBuildPath);
}



module.exports = app;