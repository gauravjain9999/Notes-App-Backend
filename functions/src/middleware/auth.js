
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const verifyToken = async (req, res, next) => {
  
  try {
    const authHeader = req.headers['authorization'] || req.body.authorizationToken;
    if (!authHeader) {
      logger.info('No token provided');
      return res.status(401).json({
        apiResponseData: { apiResponseMessage: "No token provided" },
        apiResponseStatus: false,
      });
    }
    const token = authHeader.split(' ')[1];

    if (!token) {
      logger.info('Token format invalid');
      return res.status(401).json({
        apiResponseData: { apiResponseMessage: "Token format invalid" },
        apiResponseStatus: false,
      });
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'SECRET_KEY');
    req.userData = decoded;
    next();

  } catch (error) {
    logger.error('JWT Verification Error:', error);
    return res.status(401).json({
      apiResponseData: { apiResponseMessage: "Invalid or expired token" },
      apiResponseStatus: false,
    });
  }
};

module.exports = verifyToken;
