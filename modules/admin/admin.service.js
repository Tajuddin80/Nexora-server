const mongoose = require("mongoose");
const User = require("../../models/User");
const Agreement = require("../../models/Agreement");
const Apartment = require("../../models/Apartment");
const RentPayment = require("../../models/RentPayment");

const syncMemberRoles = async () => {
  try {
    const acceptedAgreements = await Agreement.find({ status: "accepted" });
    for (const ag of acceptedAgreements) {
      if (ag.userEmail) {
        await User.updateOne(
          { email: { $regex: new RegExp(`^${ag.userEmail.trim()}$`, "i") } },
          { $set: { role: "member" } }
        );
      }
    }
  } catch (err) {
    console.error("syncMemberRoles error:", err);
  }
};

const getMembersFromDB = async () => {
  await syncMemberRoles();

  // 1. Fetch all accepted agreements (The definitive source of truth for active building members)
  const acceptedAgreements = await Agreement.find({ status: "accepted" });

  // 2. Fetch all users marked as member
  const memberUsers = await User.find({ role: "member" });

  const membersMap = new Map();

  // Populate from accepted agreements first
  for (const ag of acceptedAgreements) {
    if (!ag.userEmail) continue;
    const emailLower = ag.userEmail.trim().toLowerCase();
    
    // Find matching user document if available
    const userDoc = memberUsers.find(
      (u) => u.email && u.email.trim().toLowerCase() === emailLower
    );

    membersMap.set(emailLower, {
      _id: ag._id,
      email: ag.userEmail,
      role: "member",
      userName: ag.userName || userDoc?.displayName || userDoc?.name || ag.userEmail.split("@")[0],
      apartmentNo: ag.apartmentNo || "N/A",
      blockName: ag.blockName || ag.block || "Block A",
      floorNo: ag.floorNo || ag.floor || 1,
      rent: ag.rent || 0,
      createdAt: ag.createdAt || new Date(),
    });
  }

  // Also include any user whose role is member but may not have agreement document joined yet
  for (const u of memberUsers) {
    if (!u.email) continue;
    const emailLower = u.email.trim().toLowerCase();
    if (!membersMap.has(emailLower)) {
      const ag = acceptedAgreements.find(
        (a) => a.userEmail && a.userEmail.trim().toLowerCase() === emailLower
      );
      membersMap.set(emailLower, {
        _id: u._id,
        email: u.email,
        role: "member",
        userName: u.displayName || u.name || u.email.split("@")[0],
        apartmentNo: ag?.apartmentNo || "N/A",
        blockName: ag?.blockName || ag?.block || "Block A",
        floorNo: ag?.floorNo || ag?.floor || 1,
        rent: ag?.rent || 0,
        createdAt: u.createdAt || new Date(),
      });
    }
  }

  return Array.from(membersMap.values());
};

const removeMemberInDB = async (email) => {
  const emailTrimmed = email.trim();

  // 1. Update active agreements to rejected/removed
  const agreement = await Agreement.findOne({
    userEmail: { $regex: new RegExp(`^${emailTrimmed}$`, "i") },
    status: "accepted",
  });

  if (agreement) {
    if (agreement.apartmentId && mongoose.Types.ObjectId.isValid(agreement.apartmentId)) {
      await Apartment.findByIdAndUpdate(agreement.apartmentId, {
        $set: { available: true },
      });
    }
    await Agreement.findByIdAndUpdate(agreement._id, {
      $set: { status: "rejected", decisionAt: new Date() },
    });
  }

  // 2. Downgrade user role to user
  await User.updateOne(
    { email: { $regex: new RegExp(`^${emailTrimmed}$`, "i") } },
    { $set: { role: "user" } }
  );

  return true;
};

const getMemberDueMonthsFromDB = async (email) => {
  return await RentPayment.find(
    { userEmail: { $regex: new RegExp(`^${email.trim()}$`, "i") }, status: "unpaid" },
    "month amount"
  );
};

const getAdminStatsFromDB = async () => {
  await syncMemberRoles();

  const roomStats = await Apartment.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        available: {
          $sum: {
            $cond: [{ $eq: ["$available", true] }, 1, 0],
          },
        },
        unavailable: {
          $sum: {
            $cond: [{ $eq: ["$available", false] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        available: 1,
        unavailable: 1,
        availablePercentage: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            {
              $multiply: [{ $divide: ["$available", "$total"] }, 100],
            },
          ],
        },
        unavailablePercentage: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            {
              $multiply: [{ $divide: ["$unavailable", "$total"] }, 100],
            },
          ],
        },
      },
    },
  ]);

  const rooms = roomStats[0] || {
    total: 0,
    available: 0,
    unavailable: 0,
    availablePercentage: 0,
    unavailablePercentage: 0,
  };

  const totalUsers = await User.countDocuments();
  const dbMembersCount = await User.countDocuments({ role: "member" });
  const acceptedAgreementsCount = await Agreement.countDocuments({ status: "accepted" });

  const finalMembersCount = Math.max(dbMembersCount, acceptedAgreementsCount);

  return {
    totalRooms: rooms.total,
    availablePercentage: rooms.availablePercentage,
    unavailablePercentage: rooms.unavailablePercentage,
    totalUsers: Math.max(totalUsers, finalMembersCount),
    membersCount: finalMembersCount,
  };
};

const getMemberDashboardFromDB = async (email) => {
  if (!email) {
    throw { status: 400, message: "Email query param is required" };
  }
  const emailTrimmed = email.trim();
  const emailRegex = new RegExp(`^${emailTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");

  const agreement = await Agreement.findOne({
    userEmail: emailRegex,
    status: "accepted",
  });

  const rentPayments = await RentPayment.find({
    userEmail: emailRegex,
  });

  const unpaidRents = rentPayments.filter((r) => r.status === "unpaid");
  const paidRents = rentPayments.filter((r) => r.status === "paid");

  return {
    userEmail: emailTrimmed,
    agreement: agreement || null,
    totalUnpaid: unpaidRents.reduce((acc, curr) => acc + (curr.amount || 0), 0),
    unpaidCount: unpaidRents.length,
    paidCount: paidRents.length,
    rentPayments,
  };
};

module.exports = {
  getMembersFromDB,
  removeMemberInDB,
  getMemberDueMonthsFromDB,
  getAdminStatsFromDB,
  getMemberDashboardFromDB,
};
