const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  userId: {
    // store unique user ID
    type: String,
    required: true,
    index: true,
  },
  createdBy: {
    type: String,
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED"],
    default: "PENDING",
  },
  downloadURL: { type: String, default: null }, // optional at first
  mimeType: { type: String },
  size: { type: Number },
  presignedUrl: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", FileSchema);
