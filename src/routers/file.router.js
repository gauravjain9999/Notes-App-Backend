
const express = require('express');
const router = new express.Router();
const fileController = require('../controller/file.controller');

router.get('/files', fileController.file);
router.delete('/delete-file/:id', fileController.deleteFile);
router.post('/upload', fileController.uploadFile);
// Confirm upload & save final metadata
router.post('/confirm-upload', fileController.confirmUpload);

module.exports = router;