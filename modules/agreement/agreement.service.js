const mongoose = require("mongoose");
const Agreement = require("../../models/Agreement");
const Apartment = require("../../models/Apartment");
const User = require("../../models/User");
const RentPayment = require("../../models/RentPayment");

const createAgreementInDB = async (agreementData) => {
  const { userEmail, apartmentId } = agreementData;

  if (!apartmentId || !mongoose.Types.ObjectId.isValid(apartmentId)) {
    throw { status: 400, message: "Invalid apartment selected" };
  }

  // 1. Verify Apartment exists in DB and is currently available
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) {
    throw { status: 404, message: "Apartment not found" };
  }

  if (apartment.available === false) {
    throw { status: 400, message: "This apartment is already occupied or rented." };
  }

  // 2. Check if another user already has an accepted lease agreement for this apartment
  const existingAcceptedLease = await Agreement.findOne({
    apartmentId,
    status: "accepted",
  });
  if (existingAcceptedLease) {
    // Ensure DB state consistency
    await Apartment.findByIdAndUpdate(apartmentId, { $set: { available: false } });
    throw { status: 400, message: "This apartment is already rented to another resident." };
  }

  // 3. Check if this user already has an active (pending or accepted) agreement
  const userActiveAgreement = await Agreement.findOne({
    userEmail,
    status: { $in: ["pending", "accepted"] },
  });
  if (userActiveAgreement) {
    if (userActiveAgreement.status === "accepted") {
      throw { status: 400, message: "You already have an active apartment lease agreement." };
    } else {
      throw { status: 400, message: "You already have a pending agreement request under review." };
    }
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

    // 1. Check if apartment was already rented to someone else before this admin click
    const existingLease = await Agreement.findOne({
      _id: { $ne: id },
      apartmentId: agreement.apartmentId,
      status: "accepted",
    });

    if (existingLease) {
      // Ensure apartment is marked occupied
      if (agreement.apartmentId) {
        await Apartment.findByIdAndUpdate(agreement.apartmentId, { $set: { available: false } });
      }
      // Auto-reject this duplicate request
      await Agreement.findByIdAndUpdate(id, { $set: { status: "rejected", decisionAt: new Date() } });
      throw { status: 400, message: "This apartment has already been approved and rented to another user." };
    }

    // 2. Promote applicant to Member role
    await User.updateOne({ email: userEmail }, { $set: { role: "member" } });

    // 3. Mark Apartment as OCCUPIED (available: false)
    if (agreement.apartmentId && mongoose.Types.ObjectId.isValid(agreement.apartmentId)) {
      await Apartment.findByIdAndUpdate(agreement.apartmentId, {
        $set: { available: false },
      });

      // 4. Automatically REJECT all other pending application requests for this same apartment
      await Agreement.updateMany(
        {
          _id: { $ne: id },
          apartmentId: agreement.apartmentId,
          status: "pending",
        },
        {
          $set: { status: "rejected", decisionAt: new Date() },
        }
      );
    }

    // 5. Generate Initial Rent Payment Record
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
      // SAFE REJECTION: Only set available = true IF no active accepted lease exists for this apartment!
      const activeLease = await Agreement.findOne({
        apartmentId: agreement.apartmentId,
        status: "accepted",
      });

      if (!activeLease) {
        await Apartment.findByIdAndUpdate(agreement.apartmentId, {
          $set: { available: true },
        });
      }
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
