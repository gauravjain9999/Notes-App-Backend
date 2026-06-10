const multer = require("multer");
const storage = multer.memoryStorage(); // <-- IMPORTANT

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },

  fileFilter(req, file, cb) {
    // Clean the file name (replace spaces & special chars with "_")
    const cleanName = file.originalname.replace(/[^\w\d.-]/g, "_");
    // Save clean name in request so multer storage can use it (optional)
    file.cleanedName = cleanName;
    const allowedTypes = /\.(png|jpg|jpeg|pdf|doc|docx)$/i;
    if (!allowedTypes.test(cleanName)) {
      return cb(
        new Error("Only PNG, JPG, JPEG, PDF, DOC, DOCX files are allowed!"),
        false,
      );
    }
    cb(null, true);
  },
});

module.exports = upload;
