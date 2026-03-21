const express = require('express');
const router = new express.Router();
const userController = require("../controller/userController");
const {
  registerValidation,
  loginValidation,
  requestOtpValidation,
  verifyOtpValidation
} = require("../validators/controller-validation");
const expressValidation = require("../middleware/validators");

//Sign-Up
router.post('/user/signup', registerValidation, expressValidation, userController.signUpUser);
//Login
router.post('/user/login', loginValidation, expressValidation, userController.loginUser);
//Login via OTP
router.post('/user/request-otp', requestOtpValidation, expressValidation, userController.requestOTP);
router.post('/user/verify-otp', verifyOtpValidation, expressValidation, userController.verifyOTP);
router.post('/send-email', loginValidation, expressValidation, userController.sendEmail);
module.exports = router;