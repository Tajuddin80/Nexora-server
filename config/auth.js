const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const connectDB = require("./db");

let authInstance = null;
let mongoClient = null;

const getAuth = async () => {
  await connectDB();

  if (!authInstance) {
    const { betterAuth } = await import("better-auth");
    const { mongodbAdapter } = await import("better-auth/adapters/mongodb");

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is missing.");
    }

    if (!mongoClient) {
      mongoClient = new MongoClient(uri);
      await mongoClient.connect();
    }

    const db = mongoClient.db();

    const baseURL =
      process.env.BETTER_AUTH_URL ||
      (process.env.VERCEL ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://nexora-server-v2.vercel.app") : "http://localhost:5000");

    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      throw new Error("BETTER_AUTH_SECRET environment variable is missing.");
    }

    const socialProviders = {};
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      socialProviders.google = {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      };
    }

    const trustedOrigins = [
      "http://localhost:5173",
      "http://localhost:5000",
      "http://localhost:3000",
      "https://nexora-server-nine.vercel.app",
      "https://nexora-server-v2.vercel.app",
      "https://nexora-client.vercel.app",
      process.env.CLIENT_URL,
    ].filter(Boolean);

    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

    authInstance = betterAuth({
      database: mongodbAdapter(db),
      secret,
      baseURL,
      trustedOrigins,
      emailAndPassword: {
        enabled: true,
      },
      socialProviders,
      account: {
        accountLinking: {
          enabled: true,
        },
        skipStateCookieCheck: true, // Prevents state_mismatch error on separate frontend/backend domains on Vercel
      },
      advanced: {
        defaultCookieAttributes: {
          sameSite: isProduction ? "none" : "lax",
          secure: isProduction,
          partitioned: isProduction,
        },
      },
    });
  }

  return authInstance;
};

module.exports = getAuth;
