const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URL || process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ No MongoDB URI found. Set MONGO_URL in environment variables.');
    // Do NOT exit — let server start so you can see the error in Hostinger logs
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Do NOT call process.exit — log and continue so the process stays alive
    // API routes will fail gracefully, but server won't 503 immediately
  }
};

module.exports = connectDB;
