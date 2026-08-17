const mongoose = require("mongoose");

const agreementSchema = new mongoose.Schema(
  {
    userName: { type: String },
    userEmail: { type: String, required: true },
    floorNo: { type: Number },
    blockName: { type: String },
    apartmentNo: { type: String, required: true },
    apartmentId: { type: String },
    rent: { type: Number, required: true },
    status: { type: String, default: "pending" },
    availability: { type: Boolean },
    createdAt: { type: Date, default: Date.now },
    decisionAt: { type: Date },
  },
  { timestamps: true, collection: "allAgreements" }
);

module.exports = mongoose.model("Agreement", agreementSchema);
