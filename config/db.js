const mongoose = require("mongoose");

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!cachedPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is missing.");
    }

    cachedPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
      })
      .then((conn) => {
        console.log(`Connected to MongoDB via Mongoose successfully: ${conn.connection.host}`);
        return conn;
      })
      .catch((err) => {
        cachedPromise = null;
        console.error("MongoDB connection error:", err.message);
        throw err;
      });
  }

  await cachedPromise;
};

module.exports = connectDB;
