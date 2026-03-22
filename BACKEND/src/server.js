require('dotenv').config();

const http      = require('http');
const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const ENV  = process.env.NODE_ENV || 'development';

console.log('🔧 Starting QuickBreak server...');
console.log(`   NODE_ENV : ${ENV}`);
console.log(`   PORT     : ${PORT}`);
console.log(`   __dirname: ${__dirname}`);
console.log(`   process.cwd(): ${process.cwd()}`);
console.log(`   MONGO_URL: ${process.env.MONGO_URL ? '✅ set' : '❌ MISSING'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ set' : '❌ MISSING'}`);

// Connect to MongoDB (non-fatal — server still starts if DB is slow/unavailable)
connectDB();

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${ENV}]`);
});

// Catch unhandled promise rejections — log instead of crashing
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Catch uncaught exceptions — log instead of crashing
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});
