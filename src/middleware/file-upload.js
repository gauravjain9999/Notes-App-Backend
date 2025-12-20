// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: 'uploads',
//   filename: function(req, file, cb){
//     cb(null, file.fieldname + "_" + Date.now() +  path.extname(file.originalname));
//   }
// });

// const upload = multer({
//     storage: storage,
//     limits: {
//       fileSize: 10000000 // 1000000 Bytes = 1 MB
//     },
//     fileFilter(req, file, cb) {
//       if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) { 
//          return cb(new Error('Upload only png jpg and jpeg format'))
//        }
//      cb(undefined, true)
//     }
// });

// module.exports = upload;


const multer = require('multer');
const storage = multer.memoryStorage(); // <-- IMPORTANT

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },

  fileFilter(req, file, cb) {
    // Clean the file name (replace spaces & special chars with "_")
    const cleanName = file.originalname.replace(/[^\w\d.-]/g, "_");

    // Save clean name in request so multer storage can use it (optional)
    file.cleanedName = cleanName;

    const allowedTypes = /\.(png|jpg|jpeg|pdf|doc|docx)$/i;

    if (!allowedTypes.test(cleanName)) {
      return cb(
        new Error('Only PNG, JPG, JPEG, PDF, DOC, DOCX files are allowed!'),
        false
      );
    }

    cb(null, true);
  }

});

module.exports = upload;
