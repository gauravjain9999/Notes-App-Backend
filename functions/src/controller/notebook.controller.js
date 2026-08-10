const Notebook = require("../models/notebook.model");
const logger = require("../utils/logger");
const formatTime = require("../utils/formatTime");
const mongoose = require("mongoose");

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

module.exports = {
  getNotebook: async (req, res) => {
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

      logger.info(`[User ${userId}] GET /notebook route accessed`);

      const notebooks = await Notebook.find({
        userId: mongoose.Types.ObjectId(userId),
      })
        .sort({ updatedAt: -1 })
        .lean();

      const formattedNotebooks = notebooks.map((notebook) => ({
        ...notebook,

        createdAt: formatTime(notebook.createdAt),
        updatedAt: formatTime(notebook.updatedAt),

        children: (notebook.children || []).map((child) => ({
          ...child,

          createdAt: formatTime(child.createdAt),
          updatedAt: formatTime(child.updatedAt),
        })),
      }));

      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: {
          notebook: formattedNotebooks,
        },
        apiResponseMessage: "Notebooks fetched successfully",
      });
    } catch (error) {
      logger.error("Error fetching notebooks:", error);

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to fetch notebooks",
        },
      });
    }
  },

  // =====================================================
  // CREATE NOTEBOOK
  // POST /notebook
  // =====================================================

  createNotebook: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;
      logger.info(`[User ${userId}] POST /notebook route accessed`);
      if (!userId) {
        return res.status(401).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Unauthorized user",
          },
        });
      }

      const { title } = req.body;

      logger.info(`[User ${userId}] POST /notebook route accessed`);

      if (!title?.trim()) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Notebook title is required",
          },
        });
      }

      const notebook = await Notebook.create({
        userId: mongoose.Types.ObjectId(userId),

        title: title.trim(),

        children: [],
      });

      return res.status(201).json({
        apiResponseStatus: true,
        apiResponseData: {
          apiResponseMessage: "Notebook created successfully",

          notebookId: notebook._id,

          notebook,
        },
      });
    } catch (error) {
      logger.error("Error creating notebook:", error);

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to create notebook",
        },
      });
    }
  },

  updateNoteBook: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;
      const notebookId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Unauthorized user",
          },
        });
      }

      if (!isValidObjectId(notebookId)) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Invalid notebook ID",
          },
        });
      }

      const { title } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Notebook title is required",
          },
        });
      }

      logger.info(
        `[User ${userId}] PATCH /notebook/${notebookId} route accessed`,
      );

      const notebook = await Notebook.findOneAndUpdate(
        {
          _id: notebookId,

          userId: mongoose.Types.ObjectId(userId),
        },

        {
          $set: {
            title: title.trim(),
          },
        },

        {
          new: true,
          runValidators: true,
        },
      ).lean();

      if (!notebook) {
        return res.status(404).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Notebook not found or unauthorized",
          },
        });
      }

      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: {
          apiResponseMessage: "Notebook updated successfully",

          notebook: {
            ...notebook,

            createdAt: formatTime(notebook.createdAt),

            updatedAt: formatTime(notebook.updatedAt),

            children: (notebook.children || []).map((child) => ({
              ...child,

              createdAt: formatTime(child.createdAt),

              updatedAt: formatTime(child.updatedAt),
            })),
          },
        },
      });
    } catch (error) {
      logger.error("Error updating notebook:", error);

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to update notebook",
        },
      });
    }
  },

  // =====================================================
  // DELETE NOTEBOOK
  // DELETE /notebook/:id
  // =====================================================

  deleteNoteBook: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;
      const notebookId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Unauthorized user",
          },
        });
      }

      if (!isValidObjectId(notebookId)) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Invalid notebook ID",
          },
        });
      }

      logger.info(
        `[User ${userId}] DELETE /notebook/${notebookId} route accessed`,
      );

      const notebook = await Notebook.findOneAndDelete({
        _id: notebookId,

        userId: mongoose.Types.ObjectId(userId),
      });

      if (!notebook) {
        return res.status(404).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Notebook not found or unauthorized",
          },
        });
      }

      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: {
          apiResponseMessage: "Notebook deleted successfully",

          notebookId,
        },
      });
    } catch (error) {
      logger.error("Error deleting notebook:", error);

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to delete notebook",
        },
      });
    }
  },

  // =====================================================
  // ADD NOTE INSIDE NOTEBOOK
  // POST /notebook/:id/add-notes
  // =====================================================

  addNotesInBook: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;
      const { title, description, notebookId } = req.body;

      logger.info(
        `[User ${userId}] POST /notebook/${notebookId}/add-notes route accessed`,
      );

      if (!userId) {
        return res.status(401).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Unauthorized user",
          },
        });
      }

      if (!isValidObjectId(notebookId)) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Invalid notebook ID",
          },
        });
      }

      if (!title?.trim()) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Note title is required",
          },
        });
      }

      const notebook = await Notebook.findOneAndUpdate(
        {
          _id: notebookId,
          userId: mongoose.Types.ObjectId(userId),
        },

        {
          $push: {
            children: {
              title: title.trim(),
              description: typeof description === "string" ? description : "",
            },
          },
        },

        {
          new: true,

          runValidators: true,
        },
      );

      if (!notebook) {
        return res.status(404).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Notebook not found or unauthorized",
          },
        });
      }

      const newNote = notebook.children[notebook.children.length - 1];

      return res.status(201).json({
        apiResponseStatus: true,
        apiResponseData: {
          apiResponseMessage: "Note created successfully",

          note: {
            ...newNote.toObject(),

            createdAt: formatTime(newNote.createdAt),

            updatedAt: formatTime(newNote.updatedAt),
          },

          notebookId,
        },
      });
    } catch (error) {
      logger.error("Error adding note:", error);

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to create note",
        },
      });
    }
  },

  updateNote: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id;
      const noteId = req.params.id;

      const { title, description } = req.body;

      logger.info(
        `[User ${userId}] PATCH /notebook/note/${noteId} route accessed`,
      );

      // -------------------------
      // Authentication
      // -------------------------

      if (!userId) {
        return res.status(401).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Unauthorized user",
          },
        });
      }

      // -------------------------
      // Validate Note ID
      // -------------------------

      if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Invalid note ID",
          },
        });
      }

      // -------------------------
      // Validate title
      // -------------------------

      if (!title?.trim()) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Note title is required",
          },
        });
      }

      // -------------------------
      // Update child note
      // -------------------------

      const notebook = await Notebook.findOneAndUpdate(
        {
          userId: mongoose.Types.ObjectId(userId),

          // Find note inside children
          "children._id": mongoose.Types.ObjectId(noteId),
        },
        {
          $set: {
            "children.$.title": title.trim(),

            "children.$.description": description?.trim() || "",

            "children.$.updatedAt": new Date(),

            // Update parent notebook timestamp
            updatedAt: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      // -------------------------
      // Notebook / Note not found
      // -------------------------

      if (!notebook) {
        return res.status(404).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Note not found or unauthorized",
          },
        });
      }

      // -------------------------
      // Find updated child
      // -------------------------

      const updatedNote = notebook.children.find(
        (child) => child._id.toString() === noteId,
      );

      // -------------------------
      // Response
      // -------------------------

      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: {
          apiResponseMessage: "Note updated successfully",

          note: updatedNote,

          notebookId: notebook._id,
        },
      });
    } catch (error) {
      logger.error("Error updating note:", error);

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: error.message,
        },
      });
    }
  },
};
