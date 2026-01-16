const Note = require('../models/note.model');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
require('dotenv').config();

module.exports = {
  getNotes: async (req, res) => {
    try {
      const notes = await Note.find();
      logger.info('GET / route accessed');
      res.status(200).json({
        apiResponseData: {
          notesList: notes,
        },
        apiResponseStatus: true,
      });
    } catch (error) {
      logger.error('Error occurred while fetching notes:', error);
      return res.status(500).json({
        apiResponseData: {
          apiResponseMessage: 'Something went Wrong.Please try Again later !',
        },
      });
    }
  },
  addNotes: (req, res) => {
    logger.info('POST / route accessed');
    let notesData = new Note({
      _id: new mongoose.Types.ObjectId(),
      title: req.body.title,
      description: req.body.description,
    });
    notesData
      .save()
      .then((result) => {
        res.status(200).json({
          apiResponseData: {
            apiResponseMessage: 'Your Notes is Successfully created.',
          },
          apiResponseStatus: true,
        });
      })
      .catch((err) => {
        res.status(500).json({
          apiResponseData: {
            apiResponseMessage: 'Something Went Wrong.Please try again !',
          },
        });
      }
      );
  },
  deleteAllNotes: async (req, res) => {
    //Delete All Notes
    logger.info('PATCH / route accessed');
    try {
      await Note.deleteMany({});
      res.status(200).json({
        apiResponseData: {
          apiResponseMessage: 'All Notes Deleted Successfully.',
        },
        apiResponseStatus: true,
      });
    }
    catch (error) {
      logger.error('Error deleting notes:', error);
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: 'Something Went Wrong.Please try again !',
        },
      });
    }
  },
  deleteNotes: async (req, res) => {
    const objectId = req.params.id;
    try {
      await Note.deleteOne({
        _id: new mongoose.mongo.ObjectId(objectId),
      });
      res.status(200).json({
        apiResponseData: {
          apiResponseMessage: 'Note deleted successfully'
        },
        apiResponseStatus: true
      });
    } catch (error) {
      logger.error('Error deleting note:', error);
      res.status(500).json({
        apiResponseData: { apiResponseMessage: 'Something went wrong' },
        apiResponseStatus: false
      });
    }
  },

  deleteInTrashedNotes: async (req, res) => {
    const { id } = req.params;

    try {
      const deletedNote = await Note.findOneAndUpdate(
        {
          _id: id,
          userId: req.user.id
        },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date()
          }
        },
        { new: true }
      );

      if (!deletedNote) {
        return res.status(404).json({
          apiResponseData: {
            apiResponseMessage: 'Note not found'
          },
          apiResponseStatus: false
        });
      }

      res.status(200).json({
        apiResponseData: {
          data: deletedNote,
          apiResponseMessage: 'Note moved to trash successfully'
        },
        apiResponseStatus: true
      });

    } catch (error) {
      console.error('Delete Note Error:', error);
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: 'Something went wrong'
        },
        apiResponseStatus: false
      });
    }
  },

  editNotes: async (req, res) => {
    logger.info('POST /editNotes route accessed');
    try {
      const objectId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(objectId)) {
        return res.status(400).json({
          apiResponseData: {
            apiResponseMessage: 'Invalid note ID format'
          },
          apiResponseStatus: false
        });
      }
      const updateData = {};

      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.isFavourite !== undefined) updateData.isFavourite = req.body.isFavourite;
      // if (req.body.reminder !== undefined) updateData.reminder = req.body.reminder;
      if (req.body.tag !== undefined) updateData.tag = req.body.tag;

      const updatedNote = await Note.findOneAndUpdate(
        { _id: objectId },
        { $set: updateData },
        { new: true }
      );

      if (!updatedNote) {
        return res.status(404).json({
          apiResponseData: {
            apiResponseMessage: 'Note not found'
          },
          apiResponseStatus: false
        });
      }

      res.status(200).json({
        apiResponseData: {
          apiResponseMessage: 'Note updated successfully',
          updatedNote
        },
        apiResponseStatus: true
      });

    } catch (error) {
      logger.error('Error editing note:', error);
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: 'Something went wrong. Please try again!'
        },
        apiResponseStatus: false
      });
    }
  },

  restoreNote: async (req, res) => {
    try {
      const { id } = req.params;
      const note = await Note.findOne({ _id: id });

      console.log(note)
      if (!note) {
        return res.status(404).json({
          apiResponseData: { apiResponseMessage: 'Note not found or already active' },
          apiResponseStatus: false
        });
      }

      note.isDeleted = false;
      note.deletedAt = new Date();

      const restoredNote = await note.save();

      res.status(200).json({
        apiResponseData: {
          notesList: restoredNote,
          apiResponseMessage: 'Note restored successfully'
        },
        apiResponseStatus: true
      });
    }
    catch (error) {
      logger.error('Restore Note Error:', error);
      res.status(500).json({
        apiResponseData: { apiResponseMessage: 'Something went wrong' },
        apiResponseStatus: false
      });
    }
  },

  shortcutNotes: async (req, res) => {
    try {
      const favouriteNotes = await Note.find({
        isFavourite: true
      }).sort({ updatedAt: -1 });
      if (!favouriteNotes || favouriteNotes.length === 0) {
        return res.status(200).json({
          apiResponseData: {
            apiResponseMessage: 'No Notes found in Shortcuts'
          },
          apiResponseStatus: true
        })
      }

      return res.status(200).json({
        apiResponseData: {
          count: favouriteNotes.length,
          data: favouriteNotes
        },
        apiResponseStatus: true
      });
    } catch (error) {
      logger.error('Shortcut Notes Error:', error);
      return res.status(500).json({
        apiResponseData: {
          apiResponseMessage: 'Something went wrong.'
        },
        apiResponseStatus: false
      });
    }
  },

  removedShortcutNotes: async (req, res) => {
    const requestId = req.id || 'N/A';
    logger.info(`[${requestId}] Remove shortcut API called`);

    try {
      const noteId = req.params.id;
      logger.debug(`[${requestId}] Incoming noteId: ${noteId}`);

      if (!mongoose.Types.ObjectId.isValid(noteId)) {
        logger.warn(`[${requestId}] Invalid noteId format: ${noteId}`);

        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Invalid note id"
          }
        });
      }

      const note = await Note.findOneAndUpdate(
        { _id: noteId },
        { $set: { isFavourite: false } },
        { new: true }
      );

      if (!note) {
        logger.warn(
          `[${requestId}] Note not found in DB: ${noteId}`
        );

        return res.status(404).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Notes not found."
          }
        });
      }

      logger.info(
        `[${requestId}] Shortcut removed successfully for noteId: ${noteId}`
      );

      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: {
          apiResponseMessage: "Shortcut removed successfully",
          data: note
        }
      });

    } catch (error) {
      logger.error(`[${requestId}] Remove shortcut notes error`, {
        message: error.message,
        stack: error.stack
      });
    };
  }
};
