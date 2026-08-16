const mongoose = require("mongoose");

const rentHistorySchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    apartmentId: { type: String },
    status: { type: String, default: "unpaid" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    role: { type: String, default: "user" },
    last_log_in: { type: String },
    created_at: { type: String },
    nextRentDate: { type: Date },
    rentHistory: [rentHistorySchema],
  },
  { timestamps: true, collection: "allUsers" }
);

module.exports = mongoose.model("User", userSchema);
