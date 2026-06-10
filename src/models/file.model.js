const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  userId: {
    // store unique user ID
    type: String,
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  downloadURL: { type: String, default: null }, // optional at first
  mimeType: { type: String },
  size: { type: Number },
  presignedURL: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", FileSchema);
