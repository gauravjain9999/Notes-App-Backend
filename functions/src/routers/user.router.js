const express = require("express");
const router = new express.Router();
const userController = require("../controller/userController");
const feedbackController = require("../controller/feedback.controller");
const {
  registerValidation,
  loginValidation,
  requestOtpValidation,
  verifyOtpValidation,
  feedbackValidation,
} = require("../validators/controller-validation");
const verifyToken = require("../middleware/auth");
const expressValidation = require("../middleware/validators");

//Sign-Up
router.post(
  "/user/signup",
  registerValidation,
  expressValidation,
  userController.signUpUser,
);
//Login
router.post(
  "/user/login",
  loginValidation,
  expressValidation,
  userController.loginUser,
);
//Login via OTP
router.post(
  "/user/request-otp",
  requestOtpValidation,
  expressValidation,
  userController.requestOTP,
);
router.post(
  "/user/verify-otp",
  verifyOtpValidation,
  expressValidation,
  userController.verifyOTP,
);
router.post(
  "/send-email",
  loginValidation,
  expressValidation,
  userController.sendEmail,
);
router.post(
  "/feedback",
  verifyToken,
  feedbackValidation,
  expressValidation,
  feedbackController.submitFeedback,
);

router.put("/update-profile", verifyToken, userController.updateProfile);
router.get("/feedback/check", verifyToken, feedbackController.checkFeedback);
router.post("/google-login", verifyToken, userController.googleLogin);
module.exports = router;
