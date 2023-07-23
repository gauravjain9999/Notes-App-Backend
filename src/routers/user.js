const express = require('express');
const router = new express.Router();
const userController = require("../controller/userController");

//Sign-Up
router.post('/user/signup', userController.signUpUser);
//Login
router.post('/user/login', userController.loginUser)

module.exports = router;