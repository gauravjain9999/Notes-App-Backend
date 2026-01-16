const logger = require('../utils/logger');
const FileModel = require('../models/file.model');
const admin = require("../config/firebaseAdmin");
const bucket = admin.storage().bucket();
const { v4: uuidv4 } = require("uuid");
const waitForFile = async (fileRef, retries = 6, delay = 500) => {
    for (let i = 0; i < retries; i++) {
        const [exists] = await fileRef.exists();
        if (exists) return true;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
};

module.exports = {
    file: async (req, res) => {
        try {
            const files = await FileModel.find({ userId: req.user.id }).sort({ uploadedAt: -1 });
            const response = files.map(file => ({
                id: file._id,
                name: file.name,
                mimeType: file.mimeType,
                size: file.size,
                uploadedAt: file.uploadedAt,
                createdBy: file.createdBy,
                downloadURL: file.downloadURL
            }));

            res.status(200).json({
                apiResponseData: {
                    apiResponseMessage: "Files fetched successfully",
                    files: response
                },
                apiResponseStatus: true,
            });

        } catch (error) {
            logger.error("Error fetching files:", error);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: error.message,
                },
                apiResponseStatus: false
            });
        }
    },
    deleteFile: async (req, res) => {
        try {
            const userId = req.user.id;
            const file = await FileModel.findOne({ _id: req.params.id, createdBy: userId });

            if (!file) return res.status(404).json({
                apiResponseData: { apiResponseMessage: "File not found" },
                apiResponseStatus: false
            });

            const fileRef = bucket.file(file.name);
            await fileRef.delete();
            await FileModel.findByIdAndDelete(file._id);

            res.json({
                apiResponseData: { apiResponseMessage: "File deleted successfully" },
                apiResponseStatus: true,
            });

        } catch (error) {
            logger.error("Error deleting file:", error);
            res.status(500).json({
                apiResponseData: { apiResponseMessage: "Internal Server Error. Please try again" },
                apiResponseStatus: false
            });
        }
    },
    uploadFile: async (req, res) => {
        try {
            const userId = req.user.id;
            const { originalName, mimeType, size } = req.body;

            if (!originalName || !mimeType || !size) {
                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseData: { apiResponseMessage: "Invalid file data" }
                });
            }

            const fileName = `${originalName}`;
            const fileRef = bucket.file(fileName);

            const [uploadUrl] = await fileRef.getSignedUrl({
                version: "v4",
                action: "write",
                expires: Date.now() + 15 * 60 * 1000,
                contentType: mimeType
            });

            const saved = await FileModel.create({
                userId: req.user.id,
                name: fileName,
                mimeType,
                size,
                createdBy: userId,
                presignedUrl: uploadUrl,
                status: "PENDING"
            });

            res.status(200).json({
                apiResponseStatus: true,
                apiResponseData: { uploadUrl, file: saved }
            });

        } catch (err) {
            logger.error("Error generating upload URL:", { message: err.message, stack: err.stack });
            res.status(500).json({
                apiResponseStatus: false,
                apiResponseData: { apiResponseMessage: err.message }
            });
        }
    },
    confirmUpload: async (req, res) => {
        try {
            const userId = req.user.id;
            const { fileId } = req.body;

            if (!fileId) return res.status(400).json({
                apiResponseStatus: false,
                apiResponseData: { apiResponseMessage: "fileId is required" }
            });

            const fileDoc = await FileModel.findOne({ _id: fileId, createdBy: userId });
            if (!fileDoc) return res.status(404).json({
                apiResponseStatus: false,
                apiResponseData: { apiResponseMessage: "File not found" }
            });

            if (fileDoc.status === "COMPLETED") {
                return res.json({
                    apiResponseStatus: true,
                    apiResponseData: { file: fileDoc, apiResponseMessage: "File upload already confirmed" }
                });
            }

            const fileRef = bucket.file(fileDoc.name);
            const uploaded = await waitForFile(fileRef);

            if (!uploaded) return res.status(400).json({
                apiResponseStatus: false,
                apiResponseData: { apiResponseMessage: "File not uploaded yet" }
            });

            const token = uuidv4();
            await fileRef.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });

            const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileDoc.name)}?alt=media&token=${token}`;

            const updated = await FileModel.findByIdAndUpdate(
                fileId,
                { status: "COMPLETED", downloadURL },
                { new: true }
            );

            res.json({
                apiResponseStatus: true,
                apiResponseData: { apiResponseMessage: "Upload confirmed", file: updated }
            });

        } catch (err) {
            logger.error("confirmUpload failed", { message: err.message, stack: err.stack });
            res.status(500).json({
                apiResponseStatus: false,
                apiResponseData: { apiResponseMessage: 'Internal Server Error.' }
            });
        }
    }
};
