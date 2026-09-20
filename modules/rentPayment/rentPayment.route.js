const express = require("express");
const router = express.Router();
const {
  createPaymentIntent,
  postRentPayment,
  getRentPaymentsForUser,
  patchRentPayment,
} = require("./rentPayment.controller");
const { verifyAuth, verifyMember } = require("../../middleware/auth");
const { validate, paymentIntentSchema, rentPaymentSchema } = require("../../validators/schemas");

router.post("/create-payment-intent", verifyAuth, verifyMember, validate(paymentIntentSchema), createPaymentIntent);
router.post("/rent-payments", verifyAuth, validate(rentPaymentSchema), postRentPayment);
router.get("/rent-payments/:email", verifyAuth, getRentPaymentsForUser);
router.patch("/rent-payments/:id", verifyAuth, patchRentPayment);
router.get("/stripe-publishable-key", (req, res) => {
  res.json({
    publishableKey:
      process.env.STRIPE_PUBLISHABLE_KEY ||
      process.env.VITE_PAYMENT_PUBLISH_KEY ||
      "",
  });
});

module.exports = router;
