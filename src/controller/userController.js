const express = require('express');
const User = require('../models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt =  require('jsonwebtoken');

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
    const result = bcrypt.hash(req.body.password, 10, (err, hash) => {
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
          res.status(500).json({error: err});
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
  loginUser : async(req, res) => {
    // Find the user by email
    User.find({email: req.body.email})
    .exec()
    .then(user => {
      // If user not found, return error
      if (user.length < 1) {
        return res.status(401).json({
          message: "User Not Exist"
        });
      }
      // Compare the password using bcrypt
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (!result) {
          return res.status(401).json({
            message: 'Password Not Correct'
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
          'SECRET_KEY',
          {expiresIn: "24h"} // Set token expiration
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
        }
      });
    })
    .catch(err => {
      // Handle error
      res.status(500).json({
        message: err
      });
    });
  }
};
