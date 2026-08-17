const express = require("express");
const multer = require("multer");
const router = express.Router();
const { handleUploadImage, handleUploadVideo } = require("./upload.controller");
const { verifyAuth, verifyAdmin } = require("../../middleware/auth");
const { strictLimiter } = require("../../middleware/rateLimiter");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/image",
  verifyAuth,
  strictLimiter,
  upload.single("file"),
  handleUploadImage
);

router.post(
  "/video",
  verifyAuth,
  verifyAdmin,
  strictLimiter,
  upload.single("file"),
  handleUploadVideo
);

module.exports = router;
