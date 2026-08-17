const express = require("express");
const router = express.Router();
const {
  getAnnouncements,
  postAnnouncement,
  patchAnnouncement,
  deleteAnnouncement,
} = require("./announcement.controller");
const { verifyAuth, verifyAdmin } = require("../../middleware/auth");
const { validate, announcementSchema } = require("../../validators/schemas");

router.get("/", verifyAuth, getAnnouncements);
router.post("/", verifyAuth, verifyAdmin, validate(announcementSchema), postAnnouncement);
router.patch("/:id", verifyAuth, verifyAdmin, validate(announcementSchema), patchAnnouncement);
router.delete("/:id", verifyAuth, verifyAdmin, deleteAnnouncement);

module.exports = router;
