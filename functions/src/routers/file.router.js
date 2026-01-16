const express = require('express');
const router = new express.Router();
const fileController = require('../controller/file.controller');
const verifyToken = require('../middleware/auth');
router.use(verifyToken);
router.get('/files', verifyToken, fileController.file);
router.delete('/delete-file/:id', verifyToken, fileController.deleteFile);
router.post('/upload', verifyToken, fileController.uploadFile);
router.post('/confirm-upload', verifyToken, fileController.confirmUpload);

module.exports = router;