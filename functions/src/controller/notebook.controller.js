const Notebook = require("../models/notebook.model");
const logger = require("../utils/logger");
const formatTime = require("../utils/formatTime");
const mongoose = require("mongoose");

module.exports = {
    getNotebook: async (req, res) => {
        try {
            const userId = req.user.id;
            logger.info(`[User ${userId}] GET /notebook route accessed`);
            const notebooks = await Notebook.find({ userId }).lean();
            const formattedNotebooks = notebooks.map((nb) => ({
                ...nb,
                updatedAt: formatTime(nb.updatedAt),
                children: (nb.children || []).map((child) => ({
                    ...child,
                    updatedAt: formatTime(child.updatedAt),
                })),
            }));

            res.status(200).json({
                apiResponseData: {
                    notebook: formattedNotebooks,
                },
                apiResponseStatus: true,
            });
        } catch (error) {
            logger.error("Error fetching notebooks:", error);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: error.message,
                },
                apiResponseStatus: false,
            });
        }
    },

    createNotebook: async (req, res) => {
        try {
            const userId = req.user.id;
            const email = req.user.email;
            logger.info(`[User ${userId}] POST /notebook route accessed`);
            const notebook = new Notebook({
                userId: mongoose.Types.ObjectId(userId),
                title: req.body.title,
                createdAt: email,
                children: (req.body.children || []).map((child) => ({
                    title: child.title,
                    createdAt: email,
                    updatedAt: Date.now(),
                })),
            });

            await notebook.save();
            res.status(201).json({
                apiResponseData: {
                    apiResponseMessage: "Notebook created successfully",
                    notebookId: notebook._id,
                },
                apiResponseStatus: true,
            });
        } catch (error) {
            logger.error("Error creating notebook:", error);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: error.message,
                },
                apiResponseStatus: false,
            });
        }
    },

    updateNoteBook: async (req, res) => {
        try {
            const userId = req.user.id;
            const notebookId = req.params.id;

            logger.info(
                `[User ${userId}] PATCH /notebook/${notebookId} route accessed`
            );
            const notebook = await Notebook.findOneAndUpdate(
                { _id: notebookId, userId: mongoose.Types.ObjectId(userId) },
                req.body,
                { new: true }
            );

            if (!notebook) {
                return res.status(404).json({
                    apiResponseData: {
                        apiResponseMessage: "Notebook not found or unauthorized",
                    },
                    apiResponseStatus: false,
                });
            }

            res.status(200).json({
                apiResponseData: {
                    apiResponseMessage: "Notebook updated successfully",
                    notebook,
                },
                apiResponseStatus: true,
            });
        } catch (error) {
            logger.error("Error updating notebook:", error);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: error.message,
                },
                apiResponseStatus: false,
            });
        }
    },

    deleteNoteBook: async (req, res) => {
        try {
            const userId = req.user.id;
            const notebookId = req.params.id;

            logger.info(
                `[User ${userId}] DELETE /notebook/${notebookId} route accessed`
            );

            const notebook = await Notebook.findOneAndDelete({
                _id: notebookId,
                userId: mongoose.Types.ObjectId(userId),
            });

            if (!notebook) {
                return res.status(404).json({
                    apiResponseData: {
                        apiResponseMessage: "Notebook not found or unauthorized",
                    },
                    apiResponseStatus: false,
                });
            }

            res.status(200).json({
                apiResponseData: {
                    apiResponseMessage: "Notebook deleted successfully",
                },
                apiResponseStatus: true,
            });
        } catch (error) {
            logger.error("Error deleting notebook:", error);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: error.message,
                },
                apiResponseStatus: false,
            });
        }
    },
};
