const WebClip = require("../models/webClip.model");
const logger = require("../utils/logger");
const got = require("got").default;
require("dotenv").config();

const metascraper = require("metascraper")([
  require("metascraper-title")(),
  require("metascraper-image")(),
  require("metascraper-description")(),
  require("metascraper-logo")(),
]);

module.exports = {
  createWebClip: async (req, res) => {
    try {
      const { url } = req.body;
      const userId = req.user?.id || req.user?._id;
      // Validation
      if (!url) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "URL is required",
          },
        });
      }

      if (!userId) {
        return res.status(401).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Unauthorized user",
          },
        });
      }

      // Fetch Website HTML
      const response = await got(url, {
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      });

      const html = response.body;

      // Extract Metadata
      const metadata = await metascraper({
        html,
        url,
      });

      const faviconUrl =
        metadata.logo ||
        `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
      // Save Into DB
      const webClip = await WebClip.create({
        userId,
        title: metadata.title || "Untitled",
        description: metadata.description || "",
        image: metadata.image || "",
        favicon: faviconUrl,
        url,
        createdAt: new Date(),
      });

      return res.status(201).json({
        apiResponseStatus: true,
        apiResponseData: webClip,
        apiResponseMessage: "Web clip created successfully",
      });
    } catch (error) {
      logger.error("Error creating web clip:", error);
      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to create web clip",
        },
      });
    }
  },

  getWebClips: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;
      logger.info(`Fetching web clips for userId: ${userId}`, req.user);
      // Validate User ID
      if (!userId) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "User ID is required",
          },
        });
      }

      // Fetch Web Clips
      const webClips = await WebClip.find({
        userId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

      // Empty State
      if (!webClips?.length) {
        return res.status(200).json({
          apiResponseStatus: true,
          apiResponseData: [],
          apiResponseMessage: "No web clips found",
        });
      }
      logger.info(`${webClips.length} web clips fetched successfully`);
      // Success Response
      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: webClips,
        apiResponseMessage: "Web clips fetched successfully",
      });
    } catch (error) {
      logger.error("Error fetching web clips:", error);

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to fetch web clips",
        },
      });
    }
  },

  deleteWebClip: async (req, res) => {
    try {
      const clipId = req.params.id;
      const userId = req.user?.id || req.user?._id;

      // Validate
      if (!clipId) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Web clip ID is required",
          },
        });
      }

      // Find Clip
      const existingClip = await WebClip.findOne({
        _id: clipId,
        userId,
      });

      // Not Found
      if (!existingClip) {
        return res.status(404).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Web clip not found",
          },
        });
      }

      // Delete Clip
      await WebClip.deleteOne({
        _id: clipId,
      });

      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: {
          deletedClipId: clipId,
          apiResponseMessage: "Web clip deleted successfully",
        },
      });
    } catch (error) {
      logger.error("Error deleting web clip:", error);
      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to delete web clip",
        },
      });
    }
  },
};
