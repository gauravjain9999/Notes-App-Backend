const express = require('express');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { sendOtp, verifyOtp } = require("../utils/otp-service");

//SignUp Registration
module.exports = {
  /**
   * @function signUpUser
   * @description This function is used to sign up the user.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Promise} - A promise that resolves to an object containing the user data.
   */
  signUpUser: async (req, res) => {
    /**
     * @description Hash the password using bcrypt.hash method.
     * @param {String} password - The password to be hashed.
     * @param {Number} saltRounds - The number of salt rounds to use.
     * @param {Function} callback - The callback function to be called after hashing is done.
     */
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        /**
         * @description Create a new user object and save it to the database.
         * @type {Object}
         */
        const user = new User({
          _id: new mongoose.Types.ObjectId,
          username: req.body.username,
          password: hash,
          phone: req.body.phone,
          email: req.body.email,
          userType: req.body.userType
        });

        user.save().then((result) => {
          console.log('Result', result);
          res.status(200).json({
            apiResponseData: {
              apiResponseMessage: 'Successfully SignUp. Please Login Now!'
            },
            apiResponseStatus: true
          });
        }).catch((err) => {
          res.status(500).json({ error: err });
        });
      }
    });
  },
  /**
   * @function loginUser
   * @description This function is used to log in the user.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Promise} - A promise that resolves to an object containing the user data and authorization token.
   */
  loginUser: async (req, res) => {
    // Find the user by email
    User.find({ email: req.body.email })
      .exec()
      .then(user => {
        // If user not found, return error
        if (user.length < 1) {
          logger.info(`Login attempt fail for email: ${req.body.email}`);
          return res.status(401).json({
            apiResponseData: {
              apiResponseMessage: "User Not Exist"
            },
            apiResponseStatus: false
          });
        }
        // Compare the password using bcrypt
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
          if (!result) {
            return res.status(401).json({
              apiResponseData: {
                apiResponseMessage: 'Password Not Correct'
              },
              apiResponseStatus: false
            });
          }
          if (result) {
            // Create JWT token
            const authorizationToken = jwt.sign({
              username: user[0].username,
              userType: user[0].userType,
              email: user[0].email,
              phone: user[0].phone
            },
              process.env.JWT_SECRET,
              { expiresIn: "24h" } // Set token expiration
            );
            // Return response with user data and token
            res.status(200).json({
              apiResponseData: {
                email: user[0].email,
                phone: user[0].phone,
                userName: user[0].username,
                authorizationToken: `Bearer ${authorizationToken}`,
              },
              apiResponseStatus: true
            });
            logger.info(`Login attempt success for email: ${req.body.email}`)
          }
        });
      })
      .catch(err => {
        logger.error(`Error occurred during login: ${err}`);
        res.status(500).json({
          message: err
        });
      }
      );
  },

  requestOTP: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email is required" });

      await sendOtp(email);
      res.json({
        apiResponseData: {
          apiResponseMessage: "OTP sent successfully"
        },
        apiResponseStatus: true
      });
    } catch (error) {
      logger.error(`Send OTP Error: ${error}`);
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: "Failed to send OTP"
        },
        apiResponseStatus: false
      });
    }
  },

  verifyOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({
          apiResponseData: {
            apiResponseMessage: "Email and OTP are required",
          },
          apiResponseStatus: false
        });
      }

      const result = await verifyOtp(email, otp);
      if (!result.success) return res.status(400).json({
        apiResponseData: {
          apiResponseMessage: result,
        },
        apiResponseStatus: false
      }
      );
      // Generate token (JWT or session based)
      // For example, JWT:
      const jwt = require("jsonwebtoken");
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

      res.json({
        apiResponseData: {
          apiResponseMessage: "Login Successful",
          authorizationToken: `Bearer ${token}`,
          email: email,
          userName: email.split('@')[0] // Example username from email
        },
        apiResponseStatus: true
      });
    } catch (error) {
      logger.error(`Error occurred during OTP verification: ${error}`);
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: "Failed to verify OTP"
        },
        apiResponseStatus: false
      });
    }
  }
};
