const User = require("../models/User");
const bcrypt = require("bcryptjs");

const initAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@nexora.com";
    const adminPass = process.env.ADMIN_PASSWORD || "Admin123456!";

    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      const updateFields = { role: "admin" };
      if (adminPass) {
        updateFields.password = await bcrypt.hash(adminPass, 10);
      }
      await User.updateOne({ email: adminEmail }, { $set: updateFields });
      console.log(`Ensured Admin User ${adminEmail} with role: admin`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPass, 10);
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        created_at: new Date().toISOString(),
      });
      console.log(`Created Admin User ${adminEmail}`);
    }
  } catch (err) {
    console.error("Error in initAdmin:", err.message);
  }
};

module.exports = initAdmin;
