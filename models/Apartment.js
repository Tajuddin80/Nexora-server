const mongoose = require("mongoose");

const apartmentSchema = new mongoose.Schema(
  {
    apartmentNo: { type: String, required: true },
    floorNo: { type: Number, default: 1 },
    blockName: { type: String, default: "Block A" },
    rent: { type: Number, required: true },
    available: { type: Boolean, default: true },
    bedroomCount: { type: Number, default: 2 },
    washroomCount: { type: Number, default: 2 },
    kitchenCount: { type: Number, default: 1 },
    squareFeet: { type: Number, default: 1200 },
    image: { type: String },
    images: [{ type: String }],
    video: { type: String, default: "" },
    details: { type: String, default: "" },
    createdBy: { type: String },
  },
  { timestamps: true, collection: "allApartments" }
);

module.exports = mongoose.model("Apartment", apartmentSchema);
