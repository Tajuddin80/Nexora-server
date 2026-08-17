const express = require("express");
const router = express.Router();
const {
  getMessages,
  getConversations,
  markRead,
  sendMessage,
} = require("./chat.controller");
const { verifyAuth, verifyAdmin } = require("../../middleware/auth");

router.get("/messages/:otherEmail", verifyAuth, getMessages);
router.get("/conversations", verifyAuth, verifyAdmin, getConversations);
router.patch("/read", verifyAuth, markRead);
router.post("/message", verifyAuth, sendMessage);

module.exports = router;
