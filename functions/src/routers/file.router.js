const express = require("express");
const router = new express.Router();
const fileController = require("../controller/file.controller");
const verifyToken = require("../middleware/auth"); // ✅ auth middleware
const upload = require("../middleware/upload-image");
const fileUpload = require("../middleware/file-upload");
const webClipController = require("../controller/webClip.controller");
router.use(verifyToken); // ✅ protect all file routes

router.get("/files", verifyToken, fileController.file);
router.delete("/delete-file/:id", verifyToken, fileController.deleteFile);
router.post("/upload", verifyToken, fileController.uploadFile);
// Confirm upload & save final metadata
router.post("/confirm-upload", verifyToken, fileController.confirmUpload);
router.get("/images", verifyToken, fileController.getImages);
router.get("/documents", verifyToken, fileController.getDocuments);
// Web-Clips APIs
router.post("/create-web-clip", verifyToken, webClipController.createWebClip);

router.get("/web-clips", verifyToken, webClipController.getWebClips);
router.delete(
  "/delete-web-clip/:id",
  verifyToken,
  webClipController.deleteWebClip,
);

module.exports = router;
