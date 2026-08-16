const mongoose = require("mongoose");
const User = require("../../models/User");
const Agreement = require("../../models/Agreement");
const Apartment = require("../../models/Apartment");
const RentPayment = require("../../models/RentPayment");

const getMembersFromDB = async () => {
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
    userEmail: email,
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

  const updateRes = await User.updateOne(
    { email },
    { $set: { role: "user" } }
  );

  if (updateRes.matchedCount === 0) {
    throw { status: 404, message: "Member not found" };
  }

  return true;
};

const getMemberDueMonthsFromDB = async (email) => {
  return await RentPayment.find(
    { userEmail: email, status: "unpaid" },
    "month amount"
  );
};

const getAdminStatsFromDB = async () => {
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

  const userStats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        membersCount: {
          $sum: {
            $cond: [{ $eq: ["$role", "member"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalUsers: 1,
        membersCount: 1,
      },
    },
  ]);

  const users = userStats[0] || { totalUsers: 0, membersCount: 0 };

  return {
    totalRooms: rooms.total,
    availablePercentage: rooms.availablePercentage,
    unavailablePercentage: rooms.unavailablePercentage,
    totalUsers: users.totalUsers,
    membersCount: users.membersCount,
  };
};

module.exports = {
  getMembersFromDB,
  removeMemberInDB,
  getMemberDueMonthsFromDB,
  getAdminStatsFromDB,
};
