const mongoose = require("mongoose");
const uploadFileSchema = new mongoose.Schema({
  filename: String,
  url: String, // like "https://yourbucket.s3.amazonaws.com/abc.pdf"
  contentType: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UploadFile', uploadFileSchema);