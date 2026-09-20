const Message = require("../../models/Message");
const User = require("../../models/User");
const Agreement = require("../../models/Agreement");

const getMessagesBetween = async (email1, email2) => {
  const adminPattern = ["admin@nexora.com", process.env.ADMIN_EMAIL].filter(Boolean);
  const isAdminTarget = adminPattern.some((a) => a.toLowerCase() === email2.toLowerCase());

  let filter;
  if (isAdminTarget) {
    filter = {
      $or: [
        { senderEmail: { $in: adminPattern }, recipientEmail: email1 },
        { senderEmail: email1, recipientEmail: { $in: adminPattern } },
        { senderEmail: email1, recipientEmail: email2 },
        { senderEmail: email2, recipientEmail: email1 },
      ],
    };
  } else {
    filter = {
      $or: [
        { senderEmail: email1, recipientEmail: email2 },
        { senderEmail: email2, recipientEmail: email1 },
      ],
    };
  }

  return await Message.find(filter).sort({ createdAt: 1 });
};

const saveMessageInDB = async (data) => {
  return await Message.create(data);
};

const markMessagesReadInDB = async (userEmail, senderEmail) => {
  const adminPattern = ["admin@nexora.com", process.env.ADMIN_EMAIL].filter(Boolean);
  const isAdminUser = adminPattern.some((a) => a.toLowerCase() === userEmail.toLowerCase());

  if (isAdminUser) {
    return await Message.updateMany(
      { senderEmail, recipientEmail: { $in: adminPattern }, read: false },
      { $set: { read: true } }
    );
  } else {
    return await Message.updateMany(
      { senderEmail, recipientEmail: userEmail, read: false },
      { $set: { read: true } }
    );
  }
};

const getConversationsListForAdmin = async (adminEmail) => {
  const adminPattern = ["admin@nexora.com", adminEmail, process.env.ADMIN_EMAIL].filter(Boolean);

  // 1. Fetch all messages involving any admin email variant
  const allMessages = await Message.find({
    $or: [
      { senderEmail: { $in: adminPattern } },
      { recipientEmail: { $in: adminPattern } },
    ],
  }).sort({ createdAt: -1 });

  // 2. Collect unique non-admin partner emails
  const partnerEmailMap = new Map();
  allMessages.forEach((msg) => {
    const isSenderAdmin = adminPattern.some((a) => a.toLowerCase() === msg.senderEmail?.toLowerCase());
    const partner = isSenderAdmin ? msg.recipientEmail : msg.senderEmail;
    if (partner && !adminPattern.some((a) => a.toLowerCase() === partner.toLowerCase())) {
      if (!partnerEmailMap.has(partner)) {
        partnerEmailMap.set(partner, msg);
      }
    }
  });

  // 3. Also fetch all users from DB
  const users = await User.find({}).lean();
  const userMap = {};
  users.forEach((u) => {
    if (u.email) userMap[u.email.toLowerCase()] = u;
  });

  // 4. Fetch all agreements
  const agreements = await Agreement.find({});
  const agreementMap = {};
  agreements.forEach((a) => {
    if (a.userEmail) agreementMap[a.userEmail.toLowerCase()] = a;
  });

  // Combine unique partner emails + registered users
  const allUserEmailsSet = new Set([
    ...partnerEmailMap.keys(),
    ...users.map((u) => u.email).filter(Boolean),
  ]);

  const conversationItems = [];

  for (const email of allUserEmailsSet) {
    if (adminPattern.some((a) => a.toLowerCase() === email.toLowerCase())) continue;

    const emailLower = email.toLowerCase();
    const userDoc = userMap[emailLower];
    const userAgreement = agreementMap[emailLower];

    const lastMsg = partnerEmailMap.get(email) || (await Message.findOne({
      $or: [
        { senderEmail: email, recipientEmail: { $in: adminPattern } },
        { senderEmail: { $in: adminPattern }, recipientEmail: email },
      ],
    }).sort({ createdAt: -1 }));

    const unreadCount = await Message.countDocuments({
      senderEmail: email,
      recipientEmail: { $in: adminPattern },
      read: false,
    });

    conversationItems.push({
      email,
      userName: userAgreement?.userName || userDoc?.name || userDoc?.displayName || email.split("@")[0],
      photoURL: userDoc?.image || userDoc?.photoURL || "",
      role: userDoc?.role || "user",
      apartmentNo: userAgreement?.apartmentNo || "No Apartment",
      blockName: userAgreement?.blockName || "",
      floorNo: userAgreement?.floorNo || null,
      lastMessage: lastMsg ? lastMsg.message || (lastMsg.type === "image" ? "📷 Image" : "🎙️ Voice note") : "",
      lastMessageTime: lastMsg ? lastMsg.createdAt : null,
      unreadCount,
      hasHistory: !!lastMsg,
    });
  }

  // Return conversations sorted by lastMessageTime (users with history first)
  return conversationItems.sort((a, b) => {
    if (a.hasHistory && !b.hasHistory) return -1;
    if (!a.hasHistory && b.hasHistory) return 1;
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
