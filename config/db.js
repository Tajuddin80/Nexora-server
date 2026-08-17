const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is missing.");
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`Connected to MongoDB via Mongoose successfully: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    isConnected = false;
    throw err;
  }
};

module.exports = connectDB;
