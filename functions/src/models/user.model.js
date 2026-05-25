const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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
    gender: {
      type: String,
    },
    userType: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("user", userSchema);
