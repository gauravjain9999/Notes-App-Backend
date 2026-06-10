const Document = require("../models/documents.model");
const admin = require("../config/firebaseAdmin");
const bucket = admin.storage().bucket();
const logger = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  getDocuments: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;
      const documents = await Document.find({
        userId,
      }).sort({
        createdAt: -1,
      });

      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: documents,
      });
    } catch (error) {
      logger.error("GET DOCUMENTS ERROR", error);

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to fetch documents",
        },
      });
    }
  },

  uploadDocument: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;

      if (!req.file) {
        return res.status(400).json({
          apiResponseStatus: false,

          apiResponseData: {
            apiResponseMessage: "Document is required",
          },
        });
      }

      const uniqueFileName = `documents/${Date.now()}-${req.file.originalname}`;
      const fileRef = bucket.file(uniqueFileName);
      await fileRef.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      const token = uuidv4();
      await fileRef.setMetadata({
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      });

      const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uniqueFileName)}?alt=media&token=${token}`;

      const document = await Document.create({
        userId,
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });

      return res.status(201).json({
        apiResponseStatus: true,

        apiResponseMessage: "Document uploaded successfully",

        apiResponseData: document,
      });
    } catch (error) {
      logger.error("UPLOAD DOCUMENT ERROR", error);

      return res.status(500).json({
        apiResponseStatus: false,

        apiResponseData: {
          apiResponseMessage: "Failed to upload document",
        },
      });
    }
  },

  deleteDocument: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;

      const documentId = req.params.id;

      const document = await Document.findOne({
        _id: documentId,

        userId,
      });

      if (!document) {
        return res.status(404).json({
          apiResponseStatus: false,

          apiResponseData: {
            apiResponseMessage: "Document not found",
          },
        });
      }

      const storagePath = decodeURIComponent(
        document.fileUrl.split("/o/")[1].split("?")[0],
      );

      await bucket.file(storagePath).delete();
      await Document.findByIdAndDelete(documentId);

      return res.status(200).json({
        apiResponseStatus: true,

        apiResponseMessage: "Document deleted successfully",
      });
    } catch (error) {
      logger.error("DELETE DOCUMENT ERROR", error);

      return res.status(500).json({
        apiResponseStatus: false,

        apiResponseData: {
          apiResponseMessage: "Failed to delete document",
        },
      });
    }
  },
};
