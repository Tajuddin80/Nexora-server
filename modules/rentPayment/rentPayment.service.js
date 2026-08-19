const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Agreement = require("../../models/Agreement");
const Coupon = require("../../models/Coupon");
const RentPayment = require("../../models/RentPayment");
const User = require("../../models/User");

const createPaymentIntentService = async (intentData) => {
  const { userEmail, apartmentNo, fullName, couponCode } = intentData;

  const agreement = await Agreement.findOne({
    userEmail,
    apartmentNo,
    status: "accepted",
  });

  if (!agreement) {
    throw { status: 404, message: "Agreement not found" };
  }

  let rentAmount = agreement.rent;
  let discountPercent = 0;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.trim(),
    });
    if (
      coupon &&
      (!coupon.expiryDate || new Date() <= new Date(coupon.expiryDate))
    ) {
      discountPercent = coupon.discount || 0;
      rentAmount = Math.round(
        rentAmount - (rentAmount * discountPercent) / 100
      );
    } else {
      throw { status: 400, message: "Invalid or expired coupon" };
    }
  }

  const amountInCents = rentAmount * 100;

  if (!amountInCents || amountInCents <= 0) {
    throw { status: 400, message: "Invalid amount" };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    payment_method_types: ["card"],
    metadata: {
      userEmail,
      apartmentNo,
      fullName: fullName || "",
      couponCode: couponCode || "none",
      discountPercent: discountPercent.toString(),
    },
  });

  return paymentIntent.client_secret;
};

const recordRentPaymentInDB = async (paymentData) => {
  const { userEmail, apartmentId, month, transactionId, couponCode = null } = paymentData;

  const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
  if (!paymentIntent || paymentIntent.status !== "succeeded") {
    throw { status: 400, message: "Payment not completed or invalid" };
  }

  const actualAmount = paymentIntent.amount_received / 100;
  const discountPercent = paymentIntent.metadata?.discountPercent
    ? parseInt(paymentIntent.metadata.discountPercent)
    : 0;

  const unpaid = await RentPayment.findOne({
    userEmail,
    apartmentId,
    month,
    status: "unpaid",
  });

  if (unpaid) {
    await RentPayment.updateOne(
      { _id: unpaid._id },
      {
        $set: {
          status: "paid",
          paidAt: new Date(),
          amount: actualAmount,
          transactionId: paymentIntent.id,
          couponCode: couponCode || null,
          discountPercent,
        },
      }
    );
  } else {
    await RentPayment.create({
      userEmail,
      apartmentId,
      month,
      amount: actualAmount,
      status: "paid",
      paidAt: new Date(),
      transactionId: paymentIntent.id,
      couponCode: couponCode || null,
      discountPercent,
    });
  }

  await User.updateOne(
    {
      email: userEmail,
      "rentHistory.month": month,
      "rentHistory.apartmentId": apartmentId,
    },
    { $set: { "rentHistory.$.status": "paid" } }
  );

  return true;
};

const getRentPaymentsForUserFromDB = async (email, status) => {
  const filter = { userEmail: email };
  if (status) filter.status = status;
  return await RentPayment.find(filter);
};

const patchRentPaymentStatusInDB = async (id, status, transactionId) => {
  if (!transactionId) {
    throw { status: 400, message: "transactionId is required" };
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid rent record ID" };
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
  if (!paymentIntent || paymentIntent.status !== "succeeded") {
    throw { status: 400, message: "Payment not completed or invalid" };
  }

  const actualAmount = paymentIntent.amount_received / 100;
  const couponCode = paymentIntent.metadata?.couponCode || null;
  const discountPercent = paymentIntent.metadata?.discountPercent
    ? parseInt(paymentIntent.metadata.discountPercent)
    : 0;

  const updated = await RentPayment.findByIdAndUpdate(
    id,
    {
      $set: {
        status: status || "paid",
        paidAt: new Date(),
        transactionId,
        amount: actualAmount,
        couponCode,
        discountPercent,
      },
    },
    { new: true }
  );

  if (!updated) {
    throw { status: 404, message: "Rent record not found" };
  }

  await User.updateOne(
    {
      email: updated.userEmail,
      "rentHistory.month": updated.month,
      "rentHistory.apartmentId": updated.apartmentId,
    },
    { $set: { "rentHistory.$.status": "paid" } }
  );

  return updated;
};

module.exports = {
  createPaymentIntentService,
  recordRentPaymentInDB,
  getRentPaymentsForUserFromDB,
  patchRentPaymentStatusInDB,
};
