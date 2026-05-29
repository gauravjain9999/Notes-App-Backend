const crypto = require("crypto");
const logger = require("../utils/logger");
const User = require("../models/user.model");
const razorpay = require("../services/payment.service");
require("dotenv").config();

module.exports = {
  orderPlaced: async (req, res) => {
    const { amount } = req.body;
    logger.info(`Initiating order creation for amount: ${amount}`);
    try {
      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);
      return res.status(200).json({
        apiResponseStatus: true,
        order,
      });
    } catch (error) {
      logger.error("Error creating order:", error);
      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Order creation failed",
        },
      });
    }
  },

  verifyPlaced: async (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = req.body;
    logger.info(
      "userID for payment verification:",
      req.body.userId,
      req.body._id,
    );
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    logger.info("Generated signature:", generated_signature);
    logger.info("Received signature:", razorpay_signature);
    if (generated_signature === razorpay_signature) {
      // Update user premium status
      await User.findByIdAndUpdate(userId, {
        isPremium: true,
        premiumPurchasedAt: new Date(),
      });
      // Activate Premium Here
      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: {
          apiResponseMessage:
            "Payment verified successfully. Premium features activated.",
        },
      });
    }

    return res.status(400).json({
      apiResponseStatus: false,
      apiResponseData: {
        apiResponseMessage: "Invalid payment signature",
      },
    });
  },
  catch(error) {
    logger.error("Error verifying payment:", error);
    return res.status(500).json({
      apiResponseStatus: false,
      apiResponseData: {
        apiResponseMessage: "Payment verification failed",
      },
    });
  },
};
