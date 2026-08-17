const Message = require("../../models/Message");
const User = require("../../models/User");
const Agreement = require("../../models/Agreement");

const getMessagesBetween = async (email1, email2) => {
  return await Message.find({
    $or: [
      { senderEmail: email1, recipientEmail: email2 },
      { senderEmail: email2, recipientEmail: email1 },
    ],
  }).sort({ createdAt: 1 });
};

const saveMessageInDB = async (data) => {
  return await Message.create(data);
};

const markMessagesReadInDB = async (userEmail, senderEmail) => {
  return await Message.updateMany(
    { senderEmail, recipientEmail: userEmail, read: false },
    { $set: { read: true } }
  );
};

const getConversationsListForAdmin = async (adminEmail) => {
  const members = await User.find({ role: { $in: ["member", "user"] } }).select("email role created_at");
  const agreements = await Agreement.find({ status: "accepted" });
  
  const agreementMap = {};
  agreements.forEach((a) => {
    agreementMap[a.userEmail] = a;
  });

  const conversations = await Promise.all(
    members.map(async (u) => {
      const lastMessage = await Message.findOne({
        $or: [
          { senderEmail: u.email, recipientEmail: adminEmail },
          { senderEmail: adminEmail, recipientEmail: u.email },
        ],
      }).sort({ createdAt: -1 });

      const unreadCount = await Message.countDocuments({
        senderEmail: u.email,
        recipientEmail: adminEmail,
        read: false,
      });

      const userAgreement = agreementMap[u.email];

      return {
        email: u.email,
        userName: userAgreement?.userName || u.email.split("@")[0],
        role: u.role,
        apartmentNo: userAgreement?.apartmentNo || "No Apartment",
        blockName: userAgreement?.blockName || "",
        floorNo: userAgreement?.floorNo || null,
        lastMessage: lastMessage ? lastMessage.message || (lastMessage.type === "image" ? "📷 Image" : "🎙️ Voice message") : "",
        lastMessageTime: lastMessage ? lastMessage.createdAt : null,
        unreadCount,
      };
    })
  );

  return conversations.sort((a, b) => {
    if (!a.lastMessageTime) return 1;
    if (!b.lastMessageTime) return -1;
    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
  });
};

module.exports = {
  getMessagesBetween,
  saveMessageInDB,
  markMessagesReadInDB,
  getConversationsListForAdmin,
};
