const { fromNodeHeaders } = require("better-auth/node");
const auth = require("../config/auth");
const User = require("../models/User");

const verifyAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ message: "unauthorized access - invalid or missing session" });
    }

    req.session = session.session;
    req.user = session.user;
    req.decoded = {
      email: session.user.email,
      id: session.user.id,
      role: session.user.role || "user",
    };

    next();
  } catch (error) {
    console.error("Better Auth verification error:", error);
    return res.status(403).json({ message: "forbidden access - session error" });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.decoded?.email;
    if (!email) {
      return res.status(403).json({ message: "forbidden access - missing user email" });
    }
    const user = await User.findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "forbidden access - admin role required" });
    }
    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error during admin verification" });
  }
};

const verifyMember = async (req, res, next) => {
  try {
    const email = req.decoded?.email;
    if (!email) {
      return res.status(403).json({ message: "forbidden access - missing user email" });
    }
    const user = await User.findOne({ email });

    if (!user || user.role !== "member") {
      return res.status(403).json({ message: "forbidden access - member role required" });
    }
    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error during member verification" });
  }
};

module.exports = {
  verifyAuth,
  verifyToken: verifyAuth,
  verifyAdmin,
  verifyMember,
};
