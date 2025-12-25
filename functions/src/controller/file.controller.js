const logger = require('../utils/logger');
const FileModel = require('../models/file.model');
const admin = require("../config/firebaseAdmin");
const bucket = admin.storage().bucket();
const { v4: uuidv4 } = require("uuid");

module.exports = {
    file: async (req, res) => {
        try {
            const files = await FileModel.find().sort({ uploadedAt: -1 });
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
            }
            );

        } catch (error) {
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: error.message,
                },
                apiResponseStatus: false
            });
        }
    },

    uploadFile: async (req, res) => {
        logger.info('POST /uploadFile route accessed');
        try {
            if (!req.file) {
                logger.warn('No file uploaded in request.');
                return res.status(400).json({ message: "No file uploaded" });
            }
            const file = req.file;
            const name = `${Date.now()}_${file.originalname}`;
            const uuid = uuidv4();
            const firebaseFile = bucket.file(name);
            // Upload to Firebase Storage
            await firebaseFile.save(file.buffer, {
                metadata: {
                    contentType: file.mimetype,
                    metadata: { firebaseStorageDownloadTokens: uuid }
                }
            });
            // Public download URL
            const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(name)}?alt=media&token=${uuid}`;
            // Save metadata in MongoDB
            const saved = await FileModel.create({
                name,
                downloadURL,
                mimeType: file.mimetype,
                size: file.size,
                createdBy: req.userData.email // from auth middleware
            });
            res.status(200).json({
                apiResponseStatus: true,
                apiResponseData: {
                    message: "File uploaded successfully",
                    file: saved
                }
            });
        } catch (err) {
            logger.error('Error uploading file:', err);
            res.status(500).json({
                apiResponseStatus: false,
                apiResponseData: { message: err.message }
            });
        }
    },

    deleteFile: async (req, res) => {
        try {
            const file = await FileModel.findById(req.params.id);
            if (!file) return res.status(404).json({
                apiResponseData: {
                    apiResponseMessage: "File not found"
                },
                apiResponseStatus: false
            });
            // delete from firebase storage
            const bucket = admin.storage().bucket();
            const fileRef = bucket.file(file.name);
            await fileRef.delete();

            // delete from mongodb
            await FileModel.findByIdAndDelete(req.params.id);

            res.json({
                apiResponseData: {
                    apiResponseMessage: "File deleted successfully"
                },
                apiResponseStatus: true,
            });
        }
        catch (error) {
            logger.error('Error deleting file:', error);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: 'Internal Server Error. Please try again'
                },
                apiResponseStatus: false
            });
        }
    }
}





