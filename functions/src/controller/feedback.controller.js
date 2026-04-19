const Feedback = require("../models/feedback.modal");
const logger = require('../utils/logger');
module.exports = {
    submitFeedback: async (req, res) => {
        try {
            const { rating, message } = req.body;
            const email = req.user?.email;

            if (!email) {
                return res.status(401).json({
                    apiResponseStatus: false,
                    apiResponseData: {
                        apiResponseMessage: "User not authenticated"
                    }
                });
            }

            if (!rating || !message) {
                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseData: {
                        apiResponseMessage: "Rating and message are required"
                    }
                });
            }

            // 🔥 Check existing feedback
            const existing = await Feedback.findOne({ email });

            if (existing) {
                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseData: {
                        apiResponseMessage: "You have already submitted feedback"
                    }
                });
            }

            const feedback = await Feedback.create({
                email,
                rating,
                message
            });

            return res.status(201).json({
                apiResponseStatus: true,
                apiResponseData: {
                    apiResponseMessage: "Feedback submitted successfully",
                    feedbackId: feedback._id
                }
            });

        } catch (error) {
            // 💣 Handle duplicate key error (backup safety)
            if (error.code === 11000) {
                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseData: {
                        apiResponseMessage: "You already submitted feedback"
                    }
                });
            }

            return res.status(500).json({
                apiResponseStatus: false,
                apiResponseData: {
                    apiResponseMessage: "Failed to submit feedback"
                }
            });
        }
    }
};