const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderEmail: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    message: { type: String, default: "" },
    type: {
      type: String,
      enum: ["text", "image", "voice"],
      default: "text",
    },
    mediaUrl: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "allMessages" }
);

messageSchema.index({ senderEmail: 1, recipientEmail: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
