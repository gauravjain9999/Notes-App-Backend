const { body } = require("express-validator");

exports.registerValidation = [
  body("username")
    .notEmpty().withMessage("Username is required"),

  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email"),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),

  body("phone")
    .notEmpty().withMessage("Phone number is required")
    .isMobilePhone().withMessage("Invalid phone number")
    .isLength({ min: 10 }).withMessage("Phone number must be of 10 digits"),

  body("userType")
    .notEmpty().withMessage("Invalid user type")
];

exports.loginValidation = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required")
];

exports.requestOtpValidation = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
];

exports.verifyOtpValidation = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email"),
  body("otp")
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 4, max: 6 }).withMessage("OTP must be 6 digits")
];

exports.feedbackValidation = [
  body("rating")
    .notEmpty().withMessage("Rating is required")
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),

  body("message")
    .notEmpty().withMessage("Message is required")
    .isLength({ min: 5 }).withMessage("Message must be at least 5 characters")
];
