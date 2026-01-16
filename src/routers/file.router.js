
const express = require('express');
const router = new express.Router();
const fileController = require('../controller/file.controller');
const verifyToken = require('../middleware/auth'); // ✅ auth middleware
router.use(verifyToken); // ✅ protect all file routes
router.get('/files', verifyToken, fileController.file);
router.delete('/delete-file/:id', verifyToken, fileController.deleteFile);
router.post('/upload', verifyToken, fileController.uploadFile);
// Confirm upload & save final metadata
router.post('/confirm-upload', verifyToken, fileController.confirmUpload);

module.exports = router;