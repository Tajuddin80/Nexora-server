const rateLimit = require("express-rate-limit");

// Global Rate Limiter: max 200 requests per 1 minute per IP
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Rate limit exceeded (200 requests/min). Please slow down slightly.",
  },
});

// Strict Rate Limiter for Auth & Direct Media Uploads: max 50 requests per 1 minute per IP
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Sensitive action rate limit reached (50 requests/min). Please wait a moment.",
  },
});

module.exports = {
  globalLimiter,
  strictLimiter,
};
