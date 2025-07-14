const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads',
  filename: function(req, file, cb){
    cb(null, file.fieldname + "_" + Date.now() +  path.extname(file.originalname));
  }
});
  
const upload = multer({
    storage: storage,
    limits: {
      fileSize: 10000000 // 1000000 Bytes = 1 MB
    },
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) { 
         return cb(new Error('Upload only png jpg and jpeg format'))
       }
     cb(undefined, true)
    }
});

module.exports = upload;
