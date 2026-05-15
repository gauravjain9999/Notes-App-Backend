const admin = require("../config/firebaseAdmin");
const FcmToken = require("../models/fcmToken.model");
const logger = require("../utils/logger");

module.exports = {
    sendNotification: async (req, res) => {
        try {
            const { token, title, body, eventId, name } = req.body;

            if (!token) {
                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseData: {
                        apiResponseMessage: "FCM token is required",
                    },
                });
            }

            const message = {
                token,

                notification: {
                    title: title || "Notification",
                    body: body || "",
                },

                data: {
                    title: title || "",
                    body: body || "",
                    eventId: eventId || "",
                    name: name || "",
                },
            };

            const response = await admin.messaging().send(message);

            return res.status(200).json({
                apiResponseStatus: true,
                apiResponseData: {
                    apiResponseMessage: "Notification sent successfully.",
                },
            });
        } catch (error) {
            console.error("Notification sending error:", error);

            return res.status(500).json({
                apiResponseStatus: false,
                apiResponseData: {
                    apiResponseMessage: "Failed to send notification",
                },
            });
        }
    },

    registerToken: async (req, res) => {
        try {
            const { token, name, device } = req.body;
            logger.info("Registering FCM token:", { token, name, device });
            if (!token) {
                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseMessage: "FCM token is required",
                });
            }

            const result = await FcmToken.updateOne(
                { token },
                {
                    token,
                    device: device || "web",
                    name,
                },
                { upsert: true },
            );

            if (!result) {
                throw new Error("Failed to update token in database");
            }

            return res.status(200).json({
                apiResponseStatus: true,
                apiResponseMessage: "Token registered successfully",
            });
        } catch (error) {
            console.error("Token registration error:", error);
            return res.status(500).json({
                apiResponseStatus: false,
                apiResponseMessage: "Failed to register token",
            });
        }
    },
};
