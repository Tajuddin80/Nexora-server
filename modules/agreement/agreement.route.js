const express = require("express");
const router = express.Router();
const {
  createAgreement,
  getAgreements,
  updateAgreement,
  getUserAgreements,
} = require("./agreement.controller");
const { verifyAuth, verifyAdmin } = require("../../middleware/auth");
const { validate, agreementSchema } = require("../../validators/schemas");

router.post("/", verifyAuth, validate(agreementSchema), createAgreement);
router.get("/", verifyAuth, verifyAdmin, getAgreements);
router.patch("/:id", verifyAuth, verifyAdmin, updateAgreement);
router.get("/user/:email", verifyAuth, getUserAgreements);

module.exports = router;
