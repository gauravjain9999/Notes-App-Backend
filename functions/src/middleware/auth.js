const jwt = require("jsonwebtoken");
const admin = require("../config/firebaseAdmin");
const logger = require("../utils/logger");

// Detect Google token (Firebase ID Token)
const isGoogleToken = (token) => {
  // Google ID token always has 3 parts and is long (1200+ characters)
  return token && token.length > 500;
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader =
      req.headers["authorization"] || req.body.authorizationToken;

    if (!authHeader) {
      logger.info("No token provided");
      return res.status(401).json({
        apiResponseData: { apiResponseMessage: "No token provided" },
        apiResponseStatus: false,
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      logger.info("Token format invalid");
      return res.status(401).json({
        apiResponseData: { apiResponseMessage: "Token format invalid" },
        apiResponseStatus: false,
      });
    }

    // --------------------------
    // 1️⃣ GOOGLE TOKEN DETECTION
    // --------------------------
    if (isGoogleToken(token)) {
      try {
        logger.info("Google Token detected → verifying with Firebase...");
        const decoded = await admin.auth().verifyIdToken(token);

        req.userData = {
          uid: decoded.uid,
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          provider: "google",
        };
        
        return next();
      } catch (err) {
        logger.error("Google Token Verification Failed:", err);
        return res.status(401).json({
          apiResponseData: { apiResponseMessage: "Invalid Google Token" },
          apiResponseStatus: false,
        });
      }
    }

    // --------------------------
    // 2️⃣ NORMAL JWT FROM BACKEND
    // --------------------------
    try {
      logger.info("Normal JWT detected → verifying...");
      const decoded = jwt.verify(token, process.env.SECRET_KEY || 'SECRET_KEY');
      req.userData = decoded;
      return next();
    } catch (err) {
      logger.error("Normal JWT Verification Error:", err);
      return res.status(401).json({
        apiResponseData: { apiResponseMessage: "Invalid or expired token" },
        apiResponseStatus: false,
      });
    }
  } catch (error) {
    logger.error("Unexpected Auth Error:", error);
    return res.status(500).json({
      apiResponseData: { apiResponseMessage: "Authentication failed" },
      apiResponseStatus: false,
    });
  }
};

module.exports = verifyToken;

