const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    // MongoDB will auto-create _id (ObjectId)

    firebaseUid: {
        type: String,
        unique: true,
        sparse: true, // allows local users without this field
    },

    username: String,
    password: String,
    phone: Number,
    email: String,

    userType: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("user", userSchema);
