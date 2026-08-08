const logger = require("../utils/logger");
const FileModel = require("../models/file.model");
const admin = require("../config/firebaseAdmin");
const bucket = admin.storage().bucket();
const { v4: uuidv4 } = require("uuid");

// Wait for file to exist in Firebase Storage
const waitForFile = async (fileRef, retries = 6, delay = 500) => {
  for (let i = 0; i < retries; i++) {
    const [exists] = await fileRef.exists();
    if (exists) return true;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return false;
};

module.exports = {
  // GET: List user files
  file: async (req, res) => {
    try {
      const files = await FileModel.find({ userId: req.user.id }).sort({
        uploadedAt: -1,
      });
      const response = files.map((file) => ({
        id: file._id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        uploadedAt: file.uploadedAt,
        createdBy: file.createdBy,
        downloadURL: file.downloadURL,
      }));

      res.status(200).json({
        apiResponseData: {
          apiResponseMessage: "Files fetched successfully",
          files: response,
        },
        apiResponseStatus: true,
      });
    } catch (error) {
      logger.error("Error fetching files:", error);
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: error.message,
        },
        apiResponseStatus: false,
      });
    }
  },

  // DELETE: Remove a user file
  deleteFile: async (req, res) => {
    try {
      const userId = req.user.id;
      const file = await FileModel.findOne({
        _id: req.params.id,
        createdBy: userId,
      });

      if (!file)
        return res.status(404).json({
          apiResponseData: { apiResponseMessage: "File not found" },
          apiResponseStatus: false,
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
        apiResponseData: {
          apiResponseMessage: "Internal Server Error. Please try again",
        },
        apiResponseStatus: false,
      });
    }
  },

  // POST: Generate upload URL & save metadata
  uploadFile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { originalName, mimeType, size } = req.body;

      if (!originalName || !mimeType || !size) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: { apiResponseMessage: "Invalid file data" },
        });
      }

      const fileName = `${originalName}`;
      const fileRef = bucket.file(fileName);

      const [uploadUrl] = await fileRef.getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000,
        contentType: mimeType,
      });

      const saved = await FileModel.create({
        userId: req.user.id,
        name: fileName,
        mimeType,
        size,
        createdBy: userId,
        presignedUrl: uploadUrl,
        status: "PENDING",
      });

      res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: { uploadUrl, file: saved },
      });
    } catch (err) {
      logger.error("Error generating upload URL:", {
        message: err.message,
        stack: err.stack,
      });
      res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: { apiResponseMessage: err.message },
      });
    }
  },

  // POST: Confirm upload, generate download URL
  confirmUpload: async (req, res) => {
    try {
      const userId = req.user.id || req.user?._id;
      console.log("User ID in confirmUpload:", userId);
      const { fileId } = req.body;

      if (!fileId)
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: { apiResponseMessage: "fileId is required" },
        });

      const fileDoc = await FileModel.findOne({
        _id: fileId,
        createdBy: userId,
      });
      console.log("File document found:", fileDoc);
      if (!fileDoc)
        return res.status(404).json({
          apiResponseStatus: false,
          apiResponseData: { apiResponseMessage: "File not found" },
        });

      if (fileDoc.status === "COMPLETED") {
        return res.json({
          apiResponseStatus: true,
          apiResponseData: {
            file: fileDoc,
            apiResponseMessage: "File upload already confirmed",
          },
        });
      }

      const fileRef = bucket.file(fileDoc.name);
      const uploaded = await waitForFile(fileRef);

      console.log(`File ${fileDoc.name} exists in Firebase Storage:`, uploaded);
      if (!uploaded)
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: { apiResponseMessage: "File not uploaded yet" },
        });

      const token = uuidv4();
      await fileRef.setMetadata({
        metadata: { firebaseStorageDownloadTokens: token },
      });

      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileDoc.name)}?alt=media&token=${token}`;

      console.log("Generated download URL:", downloadURL);
      const updated = await FileModel.findByIdAndUpdate(
        fileId,
        { status: "COMPLETED", downloadURL },
        { new: true },
      );

      console.log("Updated file document:", updated);
      res.json({
        apiResponseStatus: true,
        apiResponseData: {
          apiResponseMessage: "Upload confirmed",
          file: updated,
        },
      });
    } catch (err) {
      logger.error("confirmUpload failed", {
        message: err.message,
        stack: err.stack,
      });
      res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: { apiResponseMessage: "Internal Server Error." },
      });
    }
  },

  //Images Recently Catured Section
  getImages: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) {
        return res.status(401).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Unauthorized user",
          },
        });
      }

      const images = await FileModel.find({
        userId,
        mimeType: { $regex: /^image\//i },
      })
        .sort({
          createdAt: -1,
        })
        .lean();

      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: images,
        apiResponseMessage: "Images fetched successfully",
      });
    } catch (error) {
      logger.error("GET IMAGES ERROR", error);
      return res.status(500).json({
        apiResponseStatus: false,

        apiResponseData: {
          apiResponseMessage: "Failed to fetch images",
        },
      });
    }
  },

  getDocuments: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;

      if (!userId) {
        return res.status(401).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Unauthorized user",
          },
        });
      }

      const allowedMimeTypes = [
        "application/pdf",

        // Word
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        // PowerPoint
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        // Excel
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      const documents = await FileModel.find({
        userId,
        mimeType: { $in: allowedMimeTypes },
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
};
