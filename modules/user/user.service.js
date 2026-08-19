const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

const SALT_ROUNDS = 10;

const createOrUpdateUserInDB = async (userData) => {
  const { email, password, last_log_in, created_at } = userData;

  const userExists = await User.findOne({ email });
  if (userExists) {
    const updateData = { last_log_in };
    if (password) {
      updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
    }
    const updateResult = await User.updateOne({ email }, { $set: updateData });
    return {
      status: 200,
      data: {
        message: "User already exists, last_log_in updated",
        inserted: false,
        updated: updateResult.modifiedCount > 0,
      },
    };
  }

  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  }

  // Security: New registrations always default to "user" role to prevent privilege escalation exploits
  const user = await User.create({
    email,
    password: hashedPassword,
    role: "user",
    last_log_in,
    created_at,
  });
  return {
    status: 201,
    data: {
      message: "New user created",
      inserted: true,
      result: {
        _id: user._id,
        email: user.email,
        role: user.role,
        last_log_in: user.last_log_in,
        created_at: user.created_at,
      },
    },
  };
};

const loginUserService = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.password) {
    throw { status: 401, message: "Invalid email or password" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 401, message: "Invalid email or password" };
  }

  const secret = process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw { status: 500, message: "Server configuration error: missing auth secret" };
  }

  const token = jwt.sign(
    { email: user.email, role: user.role, id: user._id },
    secret,
    { expiresIn: "7d" }
  );

  return {
    message: "Login successful",
    token,
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
  };
};

const getUserRoleFromDB = async (email) => {
  if (!email) return "user";
  const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");
  let user = await User.findOne({ email: emailRegex });

  const Agreement = require("../../models/Agreement");
  const activeAgreement = await Agreement.findOne({
    userEmail: emailRegex,
    status: "accepted",
  });

  if (activeAgreement) {
    if (user) {
      if (user.role !== "member" && user.role !== "admin") {
        await User.updateOne({ _id: user._id }, { $set: { role: "member" } });
        return "member";
      }
    } else {
      await User.create({ email, role: "member" });
      return "member";
    }
  }

  if (!user) {
    return "user";
  }
  return user.role || "user";
};

module.exports = {
  createOrUpdateUserInDB,
  loginUserService,
  getUserRoleFromDB,
};
