const express = require("express");
const router = express.Router();
const {
  getApartments,
  getSingleApartment,
  createApartment,
  updateApartment,
} = require("./apartment.controller");
const { verifyAuth, verifyAdmin } = require("../../middleware/auth");
const { validate, createApartmentSchema } = require("../../validators/schemas");

router.get("/", getApartments);
router.get("/:id", getSingleApartment);
router.post("/", verifyAuth, verifyAdmin, validate(createApartmentSchema), createApartment);
router.patch("/:id", verifyAuth, verifyAdmin, updateApartment);

module.exports = router;
