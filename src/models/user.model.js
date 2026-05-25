const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // MongoDB will auto-create _id (ObjectId)
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true, // allows local users without this field
    },
    username: String,
    name: String,
    password: String,
    phone: Number,
    email: String,
    loginProvider: {
      type: String,
      enum: ["google", "email"],
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumPurchasedAt: Date,
    // Correct field
    gender: {
      type: String,
    },

    //Optional role
    userType: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("user", userSchema);
