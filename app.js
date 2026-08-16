const express = require("express");
const cors = require("cors");
const { toNodeHandler } = require("better-auth/node");
const auth = require("./config/auth");

// Import Routes
const apartmentRoutes = require("./modules/apartment/apartment.route");
const agreementRoutes = require("./modules/agreement/agreement.route");
const userRoutes = require("./modules/user/user.route");
const couponRoutes = require("./modules/coupon/coupon.route");
const rentPaymentRoutes = require("./modules/rentPayment/rentPayment.route");
const announcementRoutes = require("./modules/announcement/announcement.route");
const adminRoutes = require("./modules/admin/admin.route");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Better Auth Handler Integration (Express 5 compatible)
app.use("/api/auth", toNodeHandler(auth));

// Base Health Check
app.get("/", (req, res) => {
  res.send("Nexora API Server Running...");
});

// Mount Routes
app.use("/apartments", apartmentRoutes);
app.use("/agreements", agreementRoutes);
app.use("/users", userRoutes);
app.use("/coupons", couponRoutes);
app.use("/", rentPaymentRoutes);
app.use("/announcements", announcementRoutes);
app.use("/", adminRoutes);

module.exports = app;
