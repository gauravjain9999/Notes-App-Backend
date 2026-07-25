const logger = require("../utils/logger");
const FileModel = require("../models/file.model");
const admin = require("../config/firebaseAdmin");
const bucket = admin.storage().bucket();
const Image = require("../models/image.model");
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
      const userId = req.user.id;
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

      const updated = await FileModel.findByIdAndUpdate(
        fileId,
        { status: "COMPLETED", downloadURL },
        { new: true },
      );

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

  // uploadImage: async (req, res) => {
  //   try {
  //     const userId = req.user?.id || req.user?._id;
  //     logger.info(`User Id in Upload Image: ${userId}`);

  //     if (!userId) {
  //       return res.status(401).json({
  //         apiResponseStatus: false,
  //         apiResponseData: {
  //           apiResponseMessage: "Unauthorized user",
  //         },
  //       });
  //     }

  //     if (!req.file) {
  //       return res.status(400).json({
  //         apiResponseStatus: false,
  //         apiResponseData: {
  //           apiResponseMessage: "Image is required",
  //         },
  //       });
  //     }

  //     // Store inside images folder
  //     const fileName = `${req.file.originalname}`;
  //     const file = bucket.file(fileName);

  //     const blobStream = file.createWriteStream({
  //       resumable: false,
  //       metadata: {
  //         contentType: req.file.mimetype,
  //       },
  //     });

  //     blobStream.on("error", (error) => {
  //       logger.error("GCP Upload Error:", error);

  //       return res.status(500).json({
  //         apiResponseStatus: false,
  //         apiResponseData: {
  //           apiResponseMessage: "Failed to upload image",
  //         },
  //       });
  //     });

  //     blobStream.on("finish", async () => {
  //       try {
  //         logger.info("File uploaded successfully");
  //         // Make file publicly accessible
  //         await file.makePublic();
  //         const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  //         logger.info(`Public URL: ${publicUrl}`);
  //         const savedImage = await Image.create({
  //           userId,
  //           imageUrl: publicUrl,
  //           fileName: req.file.originalname,
  //         });
  //         logger.info(`Image metadata saved successfully: ${savedImage._id}`);
  //         return res.status(201).json({
  //           apiResponseStatus: true,
  //           apiResponseMessage: "Image uploaded successfully",
  //           apiResponseData: savedImage,
  //         });
  //       } catch (dbError) {
  //         logger.error("Error saving image metadata:", dbError);

  //         // Cleanup uploaded file if DB save fails
  //         try {
  //           await file.delete();
  //         } catch (cleanupError) {
  //           logger.error("Failed to cleanup uploaded file:", cleanupError);
  //         }
  //         return res.status(500).json({
  //           apiResponseStatus: false,
  //           apiResponseData: {
  //             apiResponseMessage: "Failed to save image metadata",
  //           },
  //         });
  //       }
  //     });
  //     blobStream.end(req.file.buffer);
  //   } catch (error) {
  //     logger.error("GCP IMAGE UPLOAD ERROR:", error);

  //     return res.status(500).json({
  //       apiResponseStatus: false,
  //       apiResponseData: {
  //         apiResponseMessage: "Failed to upload image",
  //       },
  //     });
  //   }
  // },

  uploadImage: async (req, res) => {
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

      if (!req.file) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Image is required",
          },
        });
      }

      const uniqueFileName = `images/${Date.now()}-${req.file.originalname}`;
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

      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uniqueFileName)}?alt=media&token=${token}`;

      const savedImage = await Image.create({
        userId,
        fileName: req.file.originalname,
        imageUrl,
        fileSize: req.file.size,
      });

      logger.info(`Image uploaded successfully: ${savedImage._id}`);

      return res.status(201).json({
        apiResponseStatus: true,
        apiResponseData: savedImage,
        apiResponseMessage: "Image uploaded successfully",
      });
    } catch (error) {
      logger.error("UPLOAD IMAGE ERROR", {
        message: error.message,
        stack: error.stack,
      });

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to upload image",
        },
      });
    }
  },

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

      const images = await Image.find({
        userId,
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

  deleteImage: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;
      const imageId = req.params.id;
      const image = await Image.findOne({
        _id: imageId,
        userId,
      });

      if (!image) {
        return res.status(404).json({
          apiResponseStatus: false,

          apiResponseData: {
            apiResponseMessage: "Image not found",
          },
        });
      }

      // Extract Firebase file path
      const imagePath = decodeURIComponent(
        image.imageUrl.split("/o/")[1].split("?")[0],
      );

      // Delete from Firebase Storage
      await bucket.file(imagePath).delete();

      // Delete from MongoDB
      await Image.findByIdAndDelete(imageId);

      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseMessage: "Image deleted successfully",
        apiResponseData: {
          deletedImageId: imageId,
        },
      });
    } catch (error) {
      logger.error("DELETE IMAGE ERROR", error);

      return res.status(500).json({
        apiResponseStatus: false,

        apiResponseData: {
          apiResponseMessage: "Failed to delete image",
        },
      });
    }
  },
};
