// const mongoose = require("mongoose");
// const uploadFileSchema = new mongoose.Schema({
//   filename: String,
//   url: String, // like "https://yourbucket.s3.amazonaws.com/abc.pdf"
//   contentType: String,
//   uploadedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('UploadFile', uploadFileSchema);

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
