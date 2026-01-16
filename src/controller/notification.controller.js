const admin = require("../config/firebaseAdmin");
const FcmToken = require('../models/fcmToken.model');

module.exports = {
    sendNotification: async (req, res) => {
        try {
            const { token, data } = req.body;

            const message = {
                token,
                data: {
                    title: data.title,
                    body: data.body,
                    eventId: data.eventId
                }
            };

            await admin.messaging().send(message);

            return res.status(200).json({
                apiResponseData: {
                    apiResponseMessage: 'Notification sent successfully.'
                },
                apiResponseStatus: true,
            });

        } catch (error) {
            console.error('Notification sending error:', error);
            return res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: 'Failed to send notification'
                },
                apiResponseStatus: false,
            });
        }
    },

    registerToken: async (req, res) => {
        try {
            const { token, device } = req.body;

            if (!token) {
                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseMessage: 'FCM token is required'
                });
            }

            const result = await FcmToken.updateOne(
                { token },
                { token, device },
                { upsert: true }
            );

            if (!result) {
                throw new Error('Failed to update token in database');
            }

            return res.status(200).json({
                apiResponseStatus: true,
                apiResponseMessage: 'Token registered successfully'
            });

        } catch (error) {
            console.error('Token registration error:', error);
            return res.status(500).json({
                apiResponseStatus: false,
                apiResponseMessage: 'Failed to register token'
            });
        }
    },

};