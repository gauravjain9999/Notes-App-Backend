const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

const expressValidation = (req, res, next) => {
  logger.info('expressValidation middleware called');
  const errors = validationResult(req);
  logger.info('Validation errors:', errors.array());

  if (!errors.isEmpty()) {
    logger.info('Validation failed, returning 400 error');
    return res.status(400).json({
      apiResponseStatus: false,
      apiResponseData: errors.array()
    });
  }
  logger.info('Validation passed, calling next()');
  next();
};

module.exports = expressValidation;






