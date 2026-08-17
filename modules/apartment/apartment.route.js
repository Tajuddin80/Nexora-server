const express = require("express");
const router = express.Router();
const { getApartments, createApartment } = require("./apartment.controller");
const { verifyAuth, verifyAdmin } = require("../../middleware/auth");
const { validate, createApartmentSchema } = require("../../validators/schemas");

router.get("/", getApartments);
router.post("/", verifyAuth, verifyAdmin, validate(createApartmentSchema), createApartment);

module.exports = router;
