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
    },

    uploadFile: async (req, res) => {
        logger.info("POST /uploadFile route accessed", {
            user: req.userData?.email,
            body: req.body
        });

        try {
            const { originalName, mimeType, size } = req.body;

            if (!originalName || !mimeType || !size) {
                logger.warn("Invalid file data received", {
                    originalName,
                    mimeType,
                    size
                });

                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseData: { message: "Invalid file data" }
                });
            }

            const fileName = `${Date.now()}_${uuidv4()}_${originalName}`;
            logger.info("Generated unique file name", { fileName });

            const fileRef = bucket.file(fileName);

            logger.info("Generating signed upload URL", {
                fileName,
                mimeType
            });

            const [uploadUrl] = await fileRef.getSignedUrl({
                version: "v4",
                action: "write",
                expires: Date.now() + 15 * 60 * 1000,
                contentType: mimeType
            });

            logger.info("Signed upload URL generated successfully", {
                fileName,
                expiresInMinutes: 15
            });

            logger.info("Saving file metadata to MongoDB", {
                fileName,
                createdBy: req.userData.email
            });

            const saved = await FileModel.create({
                name: fileName,
                mimeType,
                size,
                createdBy: req.userData.email,
                presignedUrl: uploadUrl,
                status: "PENDING"
            });

            logger.info("File metadata saved successfully", {
                fileId: saved._id,
                status: saved.status
            });

            return res.status(200).json({
                apiResponseStatus: true,
                apiResponseData: {
                    uploadUrl,
                    file: saved
                }
            });

        } catch (err) {
            logger.error("Error while generating signed upload URL", {
                errorMessage: err.message,
                stack: err.stack
            });

            res.status(500).json({
                apiResponseStatus: false,
                apiResponseData: {
                    apiResponseMessage: err.message
                }
            });
        }
    },

    confirmUpload: async (req, res) => {
        logger.info("POST /confirmUpload route accessed", {
            body: req.body,
            user: req.userData?.email
        });

        try {
            const { fileId } = req.body;

            if (!fileId) {
                logger.warn("confirmUpload called without fileId");
                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseData: {
                        apiResponseMessage: "fileId is required"
                    }
                });
            }

            logger.info("Fetching file from MongoDB", { fileId });
            const fileDoc = await FileModel.findById(fileId);

            if (!fileDoc) {
                logger.warn("File not found in DB", { fileId });
                return res.status(404).json({
                    apiResponseStatus: false,
                    apiResponseData: {
                        apiResponseMessage: "File not found"
                    }
                });
            }

            if (fileDoc.status === "COMPLETED") {
                logger.info("File already confirmed", { fileId });
                return res.json({
                    apiResponseStatus: true,
                    apiResponseData: {
                        file: fileDoc,
                        apiResponseMessage: "File upload already confirmed"
                    }
                });
            }

            const fileRef = bucket.file(fileDoc.name);

            logger.info("Waiting for file to appear in Firebase Storage", {
                fileName: fileDoc.name
            });

            const uploaded = await waitForFile(fileRef);

            if (!uploaded) {
                logger.warn("File not visible in Firebase after retries", {
                    fileName: fileDoc.name
                });

                return res.status(400).json({
                    apiResponseStatus: false,
                    apiResponseData: { message: "File not uploaded yet" }
                });
            }
            logger.info("File exists in Firebase, setting download token", {
                fileName: fileDoc.name
            });

            const token = uuidv4();

            await fileRef.setMetadata({
                metadata: {
                    firebaseStorageDownloadTokens: token
                }
            });

            const downloadURL =
                `https://firebasestorage.googleapis.com/v0/b/${bucket.name}` +
                `/o/${encodeURIComponent(fileDoc.name)}?alt=media&token=${token}`;

            logger.info("Updating DB record to COMPLETED", { fileId });

            const updated = await FileModel.findByIdAndUpdate(
                fileId,
                {
                    status: "COMPLETED",
                    downloadURL
                },
                { new: true }
            );

            logger.info("Upload confirmation successful", {
                fileId,
                downloadURL
            });

            return res.json({
                apiResponseStatus: true,
                apiResponseData: {
                    apiResponseMessage: "Upload confirmed",
                    file: updated
                }
            });

        } catch (err) {
            logger.error("confirmUpload failed", {
                error: err.message,
                stack: err.stack
            });

            res.status(500).json({
                apiResponseStatus: false,
                apiResponseData: {
                    apiResponseMessage: 'Internal Server Error.'
                }
            });
        }
    }
}





