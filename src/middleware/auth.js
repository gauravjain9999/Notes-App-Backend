const jwt = require("jsonwebtoken");
const admin = require("../config/firebaseAdmin");
const logger = require("../utils/logger");
const User = require("../models/user.model"); // 🔥 IMPORTANT

// Firebase ID tokens are very long
const isGoogleToken = (token) => token && token.length > 500;

const verifyToken = async (req, res, next) => {

  const requestId = req.id || "N/A";

  try {
    const authHeader =
      req.headers["authorization"] || req.body?.authorizationToken;

    if (!authHeader) {
      logger.warn(`[${requestId}] Auth failed - No token provided`);
      return res.status(401).json({
        apiResponseStatus: false,
        apiResponseData: { apiResponseMessage: "No token provided" },
      });
    }

    // Expect: Bearer <token>
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      logger.warn(`[${requestId}] Auth failed - Invalid token format`);
      return res.status(401).json({
        apiResponseStatus: false,
        apiResponseData: { apiResponseMessage: "Invalid token format" },
      });
    }

    const token = parts[1];

    /* --------------------------------------------------
       🔵 GOOGLE / FIREBASE AUTH
    -------------------------------------------------- */
    if (isGoogleToken(token)) {
      const decoded = await admin.auth().verifyIdToken(token);

      // 🔥 FIND OR CREATE USER IN MONGODB
      let user = await User.findOne({ firebaseUid: decoded.uid });

      if (!user) {
        user = await User.create({
          firebaseUid: decoded.uid,
          email: decoded.email,
          name: decoded.name,
          userType: "Male", // default for Google login
        });
      }

      // ✅ ALWAYS MONGODB ObjectId
      req.user = {
        id: user._id,
        email: user.email,
        provider: "google",
      };

      logger.info(`[${requestId}] Google user authenticated`, {
        userId: req.user?.id ? String(req.user.id) : "UNKNOWN",
      });

      return next();
    }

    /* --------------------------------------------------
       🔵 NORMAL JWT AUTH
    -------------------------------------------------- */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.userId MUST be MongoDB _id
    req.user = {
      id: decoded.userId,
      email: decoded.email || null,
      provider: "local",
    };

    logger.info(`[${requestId}] JWT user authenticated`, {
      userId: req.user?.id ? String(req.user.id) : "UNKNOWN",
    });
    return next();

  } catch (error) {
    logger.error(`[${requestId}] Authentication failed`, {
      message: error.message,
      stack: error.stack,
    });

    return res.status(401).json({
      apiResponseStatus: false,
      apiResponseData: { apiResponseMessage: "Authentication failed" },
    });
  }
};

module.exports = verifyToken;
