const mongoose = require("mongoose");
const FileSchema = new mongoose.Schema({
  name: String,
  downloadURL: String,
  mimeType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
  createdBy: String // email or userId
});
module.exports = mongoose.model("File", FileSchema);
