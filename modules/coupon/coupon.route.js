const express = require("express");
const router = express.Router();
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("./coupon.controller");
const { verifyAuth, verifyAdmin, verifyMember } = require("../../middleware/auth");
const { validate, couponSchema } = require("../../validators/schemas");

router.post("/validate", verifyAuth, verifyMember, validateCoupon);
router.get("/", getCoupons);
router.post("/", verifyAuth, verifyAdmin, validate(couponSchema), createCoupon);
router.put("/:id", verifyAuth, verifyAdmin, validate(couponSchema), updateCoupon);
router.delete("/:id", verifyAuth, verifyAdmin, deleteCoupon);

module.exports = router;
