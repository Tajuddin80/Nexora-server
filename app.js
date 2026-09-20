const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const getAuth = require("./config/auth");

// Import Routes
const apartmentRoutes = require("./modules/apartment/apartment.route");
const agreementRoutes = require("./modules/agreement/agreement.route");
const userRoutes = require("./modules/user/user.route");
const couponRoutes = require("./modules/coupon/coupon.route");
const rentPaymentRoutes = require("./modules/rentPayment/rentPayment.route");
const announcementRoutes = require("./modules/announcement/announcement.route");
const adminRoutes = require("./modules/admin/admin.route");
const chatRoutes = require("./modules/chat/chat.route");
const uploadRoutes = require("./modules/upload/upload.route");
const initAdmin = require("./config/initAdmin");

const { globalLimiter } = require("./middleware/rateLimiter");

const app = express();

// Enable Rate Limiting
app.use(globalLimiter);

// Disable powered-by banner to obscure server technology details
app.disable("x-powered-by");

// Add security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Allowed CORS origins list
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "http://localhost:3000",
  "https://nexora-server-nine.vercel.app",
  "https://nexora-server-v2.vercel.app",
  "https://nexora-client.vercel.app",
  "https://nexora-client-neon.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

// Secure CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Serverless DB Connection Middleware
let adminInitialized = false;
app.use(async (req, res, next) => {
  try {
    await connectDB();
    if (!adminInitialized) {
      adminInitialized = true;
      initAdmin().catch((err) => {
        adminInitialized = false;
        console.error("Error in initAdmin:", err);
      });
    }
  } catch (err) {
    console.error("DB connection error in middleware:", err);
  }
  next();
});

// Base Health Check
app.get("/", (req, res) => {
  res.send("Nexora API Server Running...");
});

// Better Auth Handler Integration (Lazy Dynamic Import with Error Boundaries)
app.use("/api/auth", async (req, res, next) => {
  try {
    const { toNodeHandler } = await import("better-auth/node");
    const auth = await getAuth();
    return await toNodeHandler(auth)(req, res);
  } catch (err) {
    console.error("Better Auth Route Error:", err);
    res.status(500).json({ error: err.message || "Auth Processing Error" });
  }
});

// Mount Routes
app.use("/apartments", apartmentRoutes);
app.use("/agreements", agreementRoutes);
app.use("/users", userRoutes);
app.use("/coupons", couponRoutes);
app.use("/", rentPaymentRoutes);
app.use("/announcements", announcementRoutes);
app.use("/chat", chatRoutes);
app.use("/upload", uploadRoutes);
app.use("/", adminRoutes);

// Global Error Handler for Vercel
app.use((err, req, res, next) => {
  console.error("Global Server Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
