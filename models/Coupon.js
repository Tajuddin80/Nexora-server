const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true },
    description: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    available: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "allCoupons" }
);

module.exports = mongoose.model("Coupon", couponSchema);
