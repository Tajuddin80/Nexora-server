const jwt = require("jsonwebtoken");
const User = require("../models/User");
const getAuth = require("../config/auth");

const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    // 1. Try Better Auth Session verification
    try {
      const auth = await getAuth();
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user?.email) {
        const dbUser = await User.findOne({ email: session.user.email });
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

    // 2. Try Standard JWT verification
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

    // 3. Fallback token decode
    if (token) {
      const decodedPayload = jwt.decode(token);
      if (decodedPayload && decodedPayload.email) {
        const dbUser = await User.findOne({ email: decodedPayload.email });
        if (dbUser) {
          req.decoded = { email: dbUser.email, role: dbUser.role };
          req.user = req.decoded;
          return next();
        }
      }
    }

    // 4. Fallback x-user-email header check
    const headerEmail = req.headers["x-user-email"];
    if (headerEmail) {
      const dbUser = await User.findOne({ email: headerEmail });
      if (dbUser) {
        req.decoded = { email: dbUser.email, role: dbUser.role };
        req.user = req.decoded;
        return next();
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
