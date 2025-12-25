
const express = require('express');
const router = new express.Router();
const upload = require('../middleware/file-upload');
const fileController = require('../controller/file.controller');

router.get('/files', fileController.file);
router.delete('/delete-file/:id', fileController.deleteFile);
router.post('/upload', upload.single('image'), fileController.uploadFile);

module.exports = router;