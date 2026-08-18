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

  return await User.aggregate([
    { $match: { role: "member" } },
    {
      $lookup: {
        from: "allAgreements",
        localField: "email",
        foreignField: "userEmail",
        as: "agreementInfo",
      },
    },
    {
      $addFields: {
        userName: { $arrayElemAt: ["$agreementInfo.userName", 0] },
        apartmentNo: {
          $arrayElemAt: ["$agreementInfo.apartmentNo", 0],
        },
        rent: { $arrayElemAt: ["$agreementInfo.rent", 0] },
      },
    },
    {
      $project: {
        _id: 1,
        email: 1,
        role: 1,
        userName: 1,
        apartmentNo: 1,
        rent: 1,
      },
    },
  ]);
};

const removeMemberInDB = async (email) => {
  const agreement = await Agreement.findOne({
    userEmail: { $regex: new RegExp(`^${email.trim()}$`, "i") },
    status: "accepted",
  });

  if (!agreement) {
    throw { status: 404, message: "Member's agreement not found" };
  }

  if (agreement.apartmentId && mongoose.Types.ObjectId.isValid(agreement.apartmentId)) {
    await Apartment.findByIdAndUpdate(agreement.apartmentId, {
      $set: { available: true },
    });
  }

  // Update Agreement status to rejected or removed so it doesn't stay accepted
  await Agreement.findByIdAndUpdate(agreement._id, {
    $set: { status: "rejected", decisionAt: new Date() },
  });

  const updateRes = await User.updateOne(
    { email: { $regex: new RegExp(`^${email.trim()}$`, "i") } },
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

module.exports = {
  getMembersFromDB,
  removeMemberInDB,
  getMemberDueMonthsFromDB,
  getAdminStatsFromDB,
};
