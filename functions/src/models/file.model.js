const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  downloadURL: { type: String, default: null },
  mimeType: { type: String },
  size: { type: Number },
  presignedURL: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", FileSchema);
