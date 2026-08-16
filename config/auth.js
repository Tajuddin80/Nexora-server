const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const mongoose = require("mongoose");

const auth = betterAuth({
  database: mongodbAdapter(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    return mongoose.connection.db;
  }),
  secret: process.env.BETTER_AUTH_SECRET || "nexora_better_auth_secret_key_12345",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  emailAndPassword: {
    enabled: true,
  },
});

module.exports = auth;
