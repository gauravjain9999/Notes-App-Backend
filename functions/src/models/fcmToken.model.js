const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        device: {
            type: String,
            enum: ['web', 'android', 'ios'],
            default: 'web'
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('FcmToken', fcmTokenSchema);
