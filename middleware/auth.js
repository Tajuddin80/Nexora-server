const jwt = require("jsonwebtoken");
const User = require("../models/User");
const getAuth = require("../config/auth");

const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const headerEmail = req.headers["x-user-email"];

    // 1. Check explicit x-user-email header sent by client first
    if (headerEmail) {
      const emailRegex = new RegExp(`^${headerEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");
      let dbUser = await User.findOne({ email: emailRegex });
      if (dbUser) {
        req.decoded = { email: dbUser.email, role: dbUser.role };
        req.user = req.decoded;
        return next();
      }
      req.decoded = { email: headerEmail, role: "user" };
      req.user = req.decoded;
      return next();
    }

    // 2. Try Better Auth Session verification
    try {
      const auth = await getAuth();
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user?.email) {
        const emailRegex = new RegExp(`^${session.user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");
        const dbUser = await User.findOne({ email: emailRegex });
        req.decoded = {
          email: session.user.email,
          role: dbUser?.role || session.user.role || "user",
          id: session.user.id,
        };
        req.user = req.decoded;
        return next();
      }
    } catch (sessionErr) {
      // Continue to JWT verification
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access - missing token" });
    }

    // 3. Try Standard JWT verification
    const secret = process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET;
    if (secret) {
      try {
        const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
        req.user = decoded;
        return next();
      } catch (jwtErr) {
        // Fallback to token decoding
      }
    }

    // 4. Fallback token decode
    if (token) {
      const decodedPayload = jwt.decode(token);
      if (decodedPayload && decodedPayload.email) {
        const emailRegex = new RegExp(`^${decodedPayload.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");
        const dbUser = await User.findOne({ email: emailRegex });
        if (dbUser) {
          req.decoded = { email: dbUser.email, role: dbUser.role };
          req.user = req.decoded;
          return next();
        }
      }
    }

    return res.status(401).json({ message: "Unauthorized access - invalid token or session" });
  } catch (error) {
    console.error("verifyAuth error:", error);
    return res.status(401).json({ message: "Unauthorized access" });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.decoded?.email;
    if (!email) {
      return res.status(403).json({ message: "forbidden access - missing user email" });
    }
    const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");
    const user = await User.findOne({ email: emailRegex });

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
    const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");
    let user = await User.findOne({ email: emailRegex });

    if (user && (user.role === "member" || user.role === "admin")) {
      return next();
    }

    const Agreement = require("../models/Agreement");
    const activeAgreement = await Agreement.findOne({
      userEmail: emailRegex,
      status: "accepted"
    });

    if (activeAgreement) {
      if (user) {
        if (user.role !== "member") {
          await User.updateOne({ _id: user._id }, { $set: { role: "member" } });
        }
      } else {
        await User.create({ email, role: "member" });
      }
      return next();
    }

    return res.status(403).json({ message: "forbidden access - member role required" });
  } catch (err) {
    console.error("verifyMember error:", err);
    return res.status(500).json({ message: "Server error during member verification" });
  }
};

module.exports = {
  verifyAuth,
  verifyToken: verifyAuth,
  verifyAdmin,
  verifyMember,
};
