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
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
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



module.exports = app;