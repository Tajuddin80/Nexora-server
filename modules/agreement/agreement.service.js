const mongoose = require("mongoose");
const Agreement = require("../../models/Agreement");
const Apartment = require("../../models/Apartment");
const User = require("../../models/User");
const RentPayment = require("../../models/RentPayment");

const createAgreementInDB = async (agreementData) => {
  const { userEmail, availability } = agreementData;

  if (availability === false) {
    throw { status: 400, message: "Apartment Unavailable" };
  }

  const existing = await Agreement.findOne({
    userEmail,
    status: "pending",
  });
  if (existing) {
    throw { status: 400, message: "Already applied for an apartment" };
  }

  agreementData.status = "pending";
  agreementData.createdAt = new Date();
  return await Agreement.create(agreementData);
};

const getAgreementsByStatusFromDB = async (status = "pending") => {
  return await Agreement.find({ status });
};

const updateAgreementStatusInDB = async (id, action, userEmail) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid agreement ID" };
  }

  const agreement = await Agreement.findById(id);
  if (!agreement) {
    throw { status: 404, message: "Agreement not found" };
  }

  let newStatus;
  if (action === "accept") {
    newStatus = "accepted";

    await User.updateOne({ email: userEmail }, { $set: { role: "member" } });

    if (agreement.apartmentId && mongoose.Types.ObjectId.isValid(agreement.apartmentId)) {
      await Apartment.findByIdAndUpdate(agreement.apartmentId, {
        $set: { available: false },
      });
    }

    const monthName = new Date().toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    await RentPayment.create({
      userEmail,
      apartmentId: agreement.apartmentId,
      month: monthName,
      amount: agreement.rent,
      status: "unpaid",
      generatedAt: new Date(),
    });

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    await User.updateOne(
      { email: userEmail },
      {
        $set: { nextRentDate: nextDate },
        $push: {
          rentHistory: {
            month: monthName,
            amount: agreement.rent,
            apartmentId: agreement.apartmentId,
            status: "unpaid",
            createdAt: new Date(),
          },
        },
      }
    );
  } else if (action === "reject") {
    newStatus = "rejected";
    if (agreement.apartmentId && mongoose.Types.ObjectId.isValid(agreement.apartmentId)) {
      await Apartment.findByIdAndUpdate(agreement.apartmentId, {
        $set: { available: true },
      });
    }
  } else {
    throw { status: 400, message: "Invalid action" };
  }

  await Agreement.findByIdAndUpdate(id, {
    $set: { status: newStatus, decisionAt: new Date() },
  });

  return newStatus;
};

const getUserAgreementsFromDB = async (email, status) => {
  const filter = { userEmail: email };
  if (status) filter.status = status;
  return await Agreement.find(filter);
};

module.exports = {
  createAgreementInDB,
  getAgreementsByStatusFromDB,
  updateAgreementStatusInDB,
  getUserAgreementsFromDB,
};
