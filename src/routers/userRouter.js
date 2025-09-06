const express = require('express');
const router = new express.Router();
const userController = require("../controller/userController");

//Sign-Up
router.post('/user/signup', userController.signUpUser);
//Login
router.post('/user/login', userController.loginUser);
//Login via OTP
router.post('/user/request-otp', userController.requestOTP);
router.post('/user/verify-otp', userController.verifyOTP);

module.exports = router;