const express = require('express');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { sendOtp, verifyOtp } = require("../utils/otp-service");
const Email = require('../models/email.model');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function getNameFromEmail(email) {
  let namePart = email.split("@")[0];
  namePart = namePart.replaceAll(/[0-9]/g, "");
  namePart = namePart.replaceAll(/[._]/g, " ");
  namePart = namePart.replaceAll(/([a-z])([A-Z])/g, "$1 $2");

  return namePart
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const emailHtml = `
<div style="font-family:Roboto,Arial,sans-serif;background:#f4f4f4;padding:40px;">
  <div style="max-width:600px;margin:auto;background:#fff;padding:24px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);text-align:center;">
    <h2 style="color:#3f51b5;">Welcome to SmartNotes 🎉</h2>
    <p style="font-size:16px;color:#444;">Thanks for subscribing to our updates. We're glad to have you with us!</p>
    <p style="margin-top:24px;">
      <a href="${process.env.FRONTEND_URL}" style="background:#3f51b5;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Go to Dashboard</a>
    </p>
    <p style="margin-top:32px;font-size:12px;color:#888;">You’re receiving this email because you signed up for updates.</p>
  </div>
</div>
`;

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
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(409).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "User already exists with this email"
          }
        });
      }
      // Hash password
      bcrypt.hash(req.body.password, 10, async (err, hash) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const name = req.body.name || getNameFromEmail(req.body.email); // 🔥 FIX
        // Create user with ObjectId
        const user = new User({
          _id: new mongoose.Types.ObjectId(),
          username: req.body.username,
          password: hash,
          name: name, // ✅ added
          phone: req.body.phone,
          email: req.body.email,

          userType: req.body.userType
        });

        const result = await user.save();

        logger.info("User registered successfully", {
          userId: result._id.toString(),
          email: result.email
        });

        return res.status(201).json({
          apiResponseStatus: true,
          apiResponseData: {
            apiResponseMessage: "Successfully SignUp. Please Login Now!",
            userId: result._id.toString() // ✅ Helpful for frontend
          }
        });
      });

    } catch (error) {
      logger.error("Signup error", {
        message: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Something went wrong during signup"
        }
      });
    }
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
              userId: user[0]._id.toString(),
              userType: user[0].userType,
              email: user[0].email,
              phone: user[0].phone,
              name: user[0].name || getNameFromEmail(user[0].email)
            },
              process.env.JWT_SECRET,
              { expiresIn: "24h" } // Set token expiration
            );
            // Return response with user data and token
            res.status(200).json({
              apiResponseData: {
                email: user[0].email,
                name: user[0].name,
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

      if (!result.success) {
        return res.status(400).json({
          apiResponseData: {
            apiResponseMessage: result.message
          },
          apiResponseStatus: false
        });
      }

      let user = await User.findOne({ email });
      if (!user) {
        const name = getNameFromEmail(email);
        user = await User.create({
          email,
          name
        });

      } else if (!user.name) {
        // Fix old users without name
        const name = getNameFromEmail(email);
        user.name = name;
        await user.save();
      }

      logger.info(`User logged in via OTP: ${email}, userId: ${user._id}`);

      // Generate JWT (use userId)
      const jwt = require("jsonwebtoken");

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({
        apiResponseData: {
          apiResponseMessage: "Login Successful",
          authorizationToken: `Bearer ${token}`,
          email: user.email,
          name: user.name,
          userName: user.name
        },
        apiResponseStatus: true
      });

    } catch (error) {
      logger.error(`Error occurred during OTP verification: ${error}`);

      return res.status(500).json({
        apiResponseData: {
          apiResponseMessage: "Failed to verify OTP"
        },
        apiResponseStatus: false
      });
    }
  },

  // verifyOTP: async (req, res) => {
  //   try {
  //     const { email, otp } = req.body;
  //     if (!email || !otp) {
  //       return res.status(400).json({
  //         apiResponseData: {
  //           apiResponseMessage: "Email and OTP are required",
  //         },
  //         apiResponseStatus: false
  //       });
  //     }

  //     const result = await verifyOtp(email, otp);
  //     if (!result.success) return res.status(400).json({
  //       apiResponseData: {
  //         apiResponseMessage: result,
  //       },
  //       apiResponseStatus: false
  //     }
  //     );
  //     let user = await User.findOne({ email });
  //     logger.info(`OTP verified for email: ${email}. User exists: ${!!user}`);
  //     if (!user) {
  //       const name = getNameFromEmail(email);
  //       logger.info(`Creating new user for email: ${email} with name: ${name}`);
  //       user = await User.create({
  //         email,
  //         name
  //       });
  //     }
  //     logger.info(`User logged in via OTP: ${email}, userId: ${user._id.toString()}`);
  //     // Generate token (JWT or session based)
  //     // For example, JWT:
  //     const jwt = require("jsonwebtoken");
  //     const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
  //     res.json({
  //       apiResponseData: {
  //         apiResponseMessage: "Login Successful",
  //         authorizationToken: `Bearer ${token}`,
  //         email: email,
  //         name: user.name,
  //         userName: email.split('@')[0] // Example username from email
  //       },
  //       apiResponseStatus: true
  //     });
  //   } catch (error) {
  //     logger.error(`Error occurred during OTP verification: ${error}`);
  //     res.status(500).json({
  //       apiResponseData: {
  //         apiResponseMessage: "Failed to verify OTP"
  //       },
  //       apiResponseStatus: false
  //     });
  //   }
  // },

  sendEmail: async (req, res) => {
    const { email } = req.body;
    console.log(req.body);
    if (!email) return res.status(400).json({
      apiResponseData: {
        apiResponseMessage: 'Email is required'
      },
      apiResponseStatus: false
    }
    );
    try {
      // Check if the email already exists
      const existing = await Email.findOne({ email });
      if (existing) return res.status(400).json({
        apiResponseData: {
          apiResponseMessage: 'Email already subscribed'
        },
        apiResponseStatus: false
      });
      // Create a new email subscriber
      const subscriber = new Email({ email });
      await subscriber.save();

      // Notify Admin
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'New SmartNotes Subscription',
        text: `New subscriber: ${email}`,
      });

      // Send Confirmation to User
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to SmartNotes!',
        text: `You've successfully subscribed to updates.`,
        html: emailHtml
      });
      res.status(200).json({
        apiResponseData: {
          apiResponseMessage: 'Subscription successful'
        },
        apiResponseStatus: true
      });
    } catch (err) {
      logger.error(`Error occurred during email subscription: ${err}`);
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: 'Something went wrong'
        },
        apiResponseStatus: false
      });
    }
  }
};
