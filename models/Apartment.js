const mongoose = require("mongoose");

const apartmentSchema = new mongoose.Schema(
  {
    apartmentNo: { type: String, required: true },
    floorNo: { type: Number },
    blockName: { type: String },
    rent: { type: Number, required: true },
    available: { type: Boolean, default: true },
    image: { type: String },
    images: [{ type: String }],
    video: { type: String, default: "" },
    details: { type: String, default: "" },
    createdBy: { type: String },
  },
  { timestamps: true, collection: "allApartments" }
);

module.exports = mongoose.model("Apartment", apartmentSchema);
