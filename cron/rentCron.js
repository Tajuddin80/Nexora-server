const cron = require("node-cron");
const User = require("../models/User");
const RentPayment = require("../models/RentPayment");

const initRentCron = () => {
  cron.schedule("0 1 1 * *", async () => {
    console.log(" Running monthly rent generation...");
    const now = new Date();

    const dueUsers = await User.find({
      role: "member",
      nextRentDate: { $lte: now },
    });

    for (const u of dueUsers) {
      const lastRent = u.rentHistory?.[u.rentHistory.length - 1];
      if (!lastRent || !lastRent.apartmentId) continue;

      await RentPayment.create({
        userEmail: u.email,
        apartmentId: lastRent.apartmentId,
        month: now.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        amount: lastRent.amount,
        generatedAt: now,
        status: "unpaid",
      });

      const nextDate = new Date(now);
      nextDate.setMonth(nextDate.getMonth() + 1);
      await User.updateOne(
        { email: u.email },
        {
          $set: { nextRentDate: nextDate },
          $push: {
            rentHistory: {
              month: now.toLocaleString("default", {
                month: "long",
                year: "numeric",
              }),
              amount: lastRent.amount,
              apartmentId: lastRent.apartmentId,
              status: "unpaid",
              createdAt: now,
            },
          },
        }
      );
    }
  });
};

module.exports = initRentCron;
