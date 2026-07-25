const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },

  fileFilter(req, file, cb) {
    const cleanName = file.originalname.replace(/[^\w\d.-]/g, "_");
    file.cleanedName = cleanName;
    console.log("Cleaned Image Name:", cleanName);
    const allowedTypes = /\.(png|jpg|jpeg)$/i;

    if (!allowedTypes.test(cleanName)) {
      return cb(new Error("Only PNG, JPG and JPEG files are allowed!"), false);
    }

    cb(null, true);
  },
});

module.exports = upload;
