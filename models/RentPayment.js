const mongoose = require("mongoose");

const rentPaymentSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    apartmentId: { type: String, required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: "unpaid" },
    generatedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
    transactionId: { type: String },
    couponCode: { type: String, default: null },
    discountPercent: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "allRentPayments" }
);

module.exports = mongoose.model("RentPayment", rentPaymentSchema);
