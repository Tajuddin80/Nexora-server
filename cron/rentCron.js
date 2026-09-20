const cron = require("node-cron");
const connectDB = require("../config/db");
const User = require("../models/User");
const Agreement = require("../models/Agreement");
const Apartment = require("../models/Apartment");
const RentPayment = require("../models/RentPayment");

const processMonthlyRentAndPenalties = async () => {
  await connectDB();
  console.log("⚡ Executing Monthly Rent Calculation & 3-Month Penalty Check...");
  const now = new Date();

  // 1. Process Rent Generation for Active Members
  const activeAgreements = await Agreement.find({ status: "accepted" });

  for (const ag of activeAgreements) {
    if (!ag.userEmail) continue;

    // Ensure user role is synced to member
    await User.updateOne(
      { email: { $regex: new RegExp(`^${ag.userEmail.trim()}$`, "i") } },
      { $set: { role: "member" } }
    );

    const monthName = now.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    // Check if current month bill already exists for this user
    const existingBill = await RentPayment.findOne({
      userEmail: { $regex: new RegExp(`^${ag.userEmail.trim()}$`, "i") },
      month: monthName,
    });

    if (!existingBill) {
      await RentPayment.create({
        userEmail: ag.userEmail,
        apartmentId: ag.apartmentId,
        month: monthName,
        amount: ag.rent,
        generatedAt: now,
        status: "unpaid",
      });

      const nextDate = new Date(now);
      nextDate.setMonth(nextDate.getMonth() + 1);

      await User.updateOne(
        { email: { $regex: new RegExp(`^${ag.userEmail.trim()}$`, "i") } },
        {
          $set: { nextRentDate: nextDate },
          $push: {
            rentHistory: {
              month: monthName,
              amount: ag.rent,
              apartmentId: ag.apartmentId,
              status: "unpaid",
              createdAt: now,
            },
          },
        }
      );
    }
  }

  // 2. Enforce 3-Month Default Penalty (Automatic Role Downgrade to "User")
  const members = await User.find({ role: "member" });

  for (const member of members) {
    const unpaidBills = await RentPayment.find({
      userEmail: { $regex: new RegExp(`^${member.email.trim()}$`, "i") },
      status: "unpaid",
    });

    if (unpaidBills.length >= 3) {
      console.warn(
        `🚨 Member ${member.email} has ${unpaidBills.length} consecutive unpaid months! Downgrading role to "user"...`
      );

      // A. Downgrade role to "user"
      await User.updateOne(
        { email: { $regex: new RegExp(`^${member.email.trim()}$`, "i") } },
        { $set: { role: "user" } }
      );

      // B. Terminate active agreement
      const activeAg = await Agreement.findOne({
        userEmail: { $regex: new RegExp(`^${member.email.trim()}$`, "i") },
        status: "accepted",
      });

      if (activeAg) {
        await Agreement.findByIdAndUpdate(activeAg._id, {
          $set: { status: "terminated", decisionAt: now },
        });

        // C. Free up apartment for new applicants
        if (activeAg.apartmentId) {
          await Apartment.findByIdAndUpdate(activeAg.apartmentId, {
            $set: { available: true },
          });
        }
      }
    }
  }
};

const initRentCron = () => {
  // Run automatically on 1st of every month at 00:00
  cron.schedule("0 0 1 * *", async () => {
    try {
      await processMonthlyRentAndPenalties();
    } catch (err) {
      console.error("Cron Job Execution Error:", err);
    }
  });

  // Run initial check on server startup to handle overdue bills & penalties
  processMonthlyRentAndPenalties().catch((err) =>
    console.error("Initial Cron Execution Error:", err)
  );
};

module.exports = {
  initRentCron,
  processMonthlyRentAndPenalties,
};
