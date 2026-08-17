const {
  getMessagesBetween,
  markMessagesReadInDB,
  getConversationsListForAdmin,
  saveMessageInDB,
} = require("./chat.service");

const getMessages = async (req, res) => {
  try {
    const user1 = req.decoded.email;
    const user2 = req.params.otherEmail;
    const messages = await getMessagesBetween(user1, user2);
    res.json({ success: true, messages });
  } catch (err) {
    console.error("GET /chat/messages error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getConversations = async (req, res) => {
  try {
    const adminEmail = req.decoded.email;
    const conversations = await getConversationsListForAdmin(adminEmail);
    res.json({ success: true, conversations });
  } catch (err) {
    console.error("GET /chat/conversations error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const markRead = async (req, res) => {
  try {
    const userEmail = req.decoded.email;
    const { senderEmail } = req.body;
    await markMessagesReadInDB(userEmail, senderEmail);
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("PATCH /chat/read error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const senderEmail = req.decoded.email;
    const { recipientEmail, message, type, mediaUrl } = req.body;
    const newMessage = await saveMessageInDB({
      senderEmail,
      recipientEmail,
      message,
      type: type || "text",
      mediaUrl: mediaUrl || "",
    });
    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    console.error("POST /chat/message error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getMessages,
  getConversations,
  markRead,
  sendMessage,
};
