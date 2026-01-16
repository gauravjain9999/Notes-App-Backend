const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            unique: true,
            sparse: true,
        },
        username: String,
        password: String,
        phone: Number,
        email: String,
        userType: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("user", userSchema);
