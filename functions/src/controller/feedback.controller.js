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
            // Check existing feedback
            const existing = await Feedback.findOne({ email });

            if (existing) {
                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseData: {
                        apiResponseMessage: "You have already submitted feedback"
                    }
                });
            }

            await Feedback.create({
                email,
                rating,
                message
            });
            logger.info(`Feedback submitted by ${email} with rating ${rating}`);
            return res.status(201).json({
                apiResponseStatus: true,
                apiResponseData: {
                    apiResponseMessage: "Feedback submitted successfully"
                }
            });

        } catch (error) {
            //Handle duplicate key error (backup safety)
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
    },

    checkFeedback: async (req, res) => {
        try {
            const email = req.user?.email;
            const exists = await Feedback.findOne({ email });
            return res.json({
                apiResponseStatus: true,
                apiResponseData: {
                    hasSubmitted: !!exists
                }
            });
        } catch (err) {
            logger.error(`Error checking feedback: ${err}`);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: "Error checking feedback"
                },
                apiResponseStatus: false,
            });
        }
    }
};