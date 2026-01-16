const Note = require('../models/note.model');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

//Get Notes
module.exports = {
  /**
   * This function is used to get all the notes from the database.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Promise} - A promise that resolves to an object containing the notes list.
   */
  getNotes: async (req, res) => {
    try {
      // Find all notes in the database
      const notes = await Note.find({
        userId: req.user.id,
        isDeleted: false
      }).sort({ updatedAt: -1 });
      console.log('All notes:', notes);
      // Return the notes list to the client

      logger.info('GET / route accessed');
      res.status(200).json({
        apiResponseData: {
          /**
           * An array of objects containing the notes data.
           * @type {Array<Object>}
           */
          notesList: notes
        },
        /**
         * A boolean indicating whether the API request was
         * successful or not.
         * @type {Boolean}
         */
        apiResponseStatus: true,
      });
    } catch (error) {
      logger.error('Error occurred while fetching notes:', error);
      // Return an error response to the client if something went wrong
      return res.status(500).json({
        apiResponseData: {
          /**
           * A string containing the error message.
           * @type {String}
           */
          apiResponseMessage: 'Something went Wrong.Please try Again later !',
        },
      });
    }
  },

  //Add Notes
  addNotes: async (req, res) => {
    const requestId = req.id || 'N/A';
    const userId = req.user?.id || req.user?._id;
    console.log('Adding note for userId:', req.user);
    logger.info(`[${requestId}] Add Note API called`, {
      route: 'POST /notes',
      userId
    });

    try {
      if (!userId) {
        logger.warn(`[${requestId}] Add Note failed - user not authenticated`);
        return res.status(401).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: 'Unauthorized'
          }
        });
      }

      logger.debug(`[${requestId}] Creating note`, {
        title: req.body?.title
      });

      const note = new Note({
        title: req.body.title,
        description: req.body.description,
        userId
      });

      const savedNote = await note.save();

      logger.info(`[${requestId}] Note created successfully`, {
        noteId: savedNote._id,
        userId
      });

      return res.status(201).json({
        apiResponseStatus: true,
        apiResponseData: {
          apiResponseMessage: 'Your note was created successfully.',
          noteId: savedNote._id
        }
      });

    } catch (error) {
      logger.error(`[${requestId}] Add Note error`, {
        userId,
        message: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: 'Something went wrong. Please try again!'
        }
      });
    }
  },


  /**
   * @function uploadFile
   * @description Handles file upload and saves file metadata to the database.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  // uploadFile: async (req, res) => {

  //   logger.info('POST /upload route accessed');

  //   if (!req.file) {
  //     logger.warn('No file uploaded in request.');
  //     return res.status(400).json({
  //       apiResponseData: {
  //         apiResponseMessage: 'No file uploaded.',
  //       },
  //       apiResponseStatus: false,
  //     });
  //   }

  //   const file = req.file;
  //   const fileName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);

  //   const uploadParams = {
  //     Bucket: process.env.S3_BUCKET_NAME,
  //     Key: fileName,
  //     Body: file.buffer,
  //     ContentType: file.mimetype,
  //   };

  //   try {
  //     await s3.send(new PutObjectCommand(uploadParams));
  //     const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  //     const fileData = new uploadFile({
  //       fileName: file.originalname,
  //       s3Url: s3Url,
  //       uploadedAt: new Date(),
  //       contentType: file.mimetype,
  //     });
  //     await fileData.save();
  //     logger.info(`File uploaded and saved: ${fileData.fileName}`);
  //     res.status(200).json({
  //       apiResponseData: {
  //         apiResponseMessage: 'File uploaded successfully.',
  //       },
  //       apiResponseStatus: true,
  //     });
  //   } catch (err) {
  //     logger.error('Error saving uploaded file:', err);
  //     res.status(500).json({
  //       apiResponseData: {
  //         apiResponseMessage: 'Something went wrong. Please try again!',
  //       },
  //       apiResponseStatus: false,
  //     });
  //   }

  //   // logger.info('POST /uploadFile route accessed');
  //   // if (!req.file) {
  //   //   logger.warn('No file uploaded in request.');
  //   //   return res.status(400).json({
  //   //   apiResponseData: {
  //   //     apiResponseMessage: 'No file uploaded.',
  //   //   },
  //   //   apiResponseStatus: false,
  //   //   });
  //   // }
  //   // Construct file data object
  //   // const fileData = new uploadFile({
  //   //   filename: req.file.filename, // Filename of the uploaded file
  //   //   uploadedAt: new Date(), // Timestamp when the file was uploaded
  //   //   url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`, // Full URL to access the file
  //   //   contentType: req.file.mimetype, // File MIME type
  //   // });

  //   // Save file data to the database
  //   // fileData
  //   //   .save()
  //   //   .then((result) => {
  //   //   logger.info(`File uploaded and saved: ${result.filename}`);
  //   //   res.status(200).json({
  //   //     apiResponseData: {
  //   //     apiResponseMessage: 'File uploaded successfully.',
  //   //     },
  //   //     // file: result, // Return saved file data
  //   //     apiResponseStatus: true,
  //   //   });
  //   //   })
  //   //   .catch((err) => {
  //   //   logger.error('Error saving uploaded file:', err);
  //   //   res.status(500).json({
  //   //     apiResponseData: {
  //   //     apiResponseMessage: 'Something went wrong. Please try again!',
  //   //     },
  //   //     apiResponseStatus: false,
  //   //   });
  //   //   });
  //   // 
  //   // if (!req.file) {
  //   //   return res.status(400).json({
  //   //     apiResponseData: {
  //   //       apiResponseMessage: 'No file uploaded.',
  //   //     },
  //   //     apiResponseStatus: false,
  //   //   });
  //   // }
  // },

  deleteAllNotes: async (req, res) => {
    //Delete All Notes
    logger.info('PATCH / route accessed');
    try {
      await Note.deleteMany({ userId: req.user.id });
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

  //Delete Notes
  deleteNotes: async (req, res) => {
    const objectId = req.params.id;
    try {
      await Note.deleteOne({
        _id: new mongoose.mongo.ObjectId(objectId),
        userId: req.user.id
      });
      res.status(200).json({
        apiResponseData: {
          apiResponseMessage: 'Note deleted successfully'
        },
        apiResponseStatus: true
      });
    } catch (error) {
      console.error('Delete Note Error:', error);
      res.status(500).json({
        apiResponseData: { apiResponseMessage: 'Something went wrong' },
        apiResponseStatus: false
      });
    }
  },

  deleteInTrashedNotes: async (req, res) => {
    const { id } = req.params;

    try {
      const deletedNote = await Note.findByIdAndUpdate(
        { id, userId: req.user.id },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date()
          }
        },
        { new: true } // Return updated document
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

  //Edit Notes
  // editNotes: async (req, res) => {
  //   let objectId = req.params.id;
  //   try {
  //     await Note.findOneAndUpdate({
  //       _id: objectId,
  //     },
  //       {
  //         $set: {
  //           title: req.body.title,
  //           description: req.body.description
  //         }
  //       })
  //       .then(result => {
  //         res.status(200).json({
  //           apiResponseData: {
  //             apiResponseMessage: 'Update Notes Successfully.'
  //           },
  //           apiResponseStatus: true
  //         });
  //       })
  //   }
  //   catch (error) {
  //     logger.error('Error editing note:', error);
  //     res.status(500).json({
  //       apiResponseData: {
  //         apiResponseMessage: 'Something Went Wrong.Please try again !'
  //       }
  //     });
  //   }
  // },

  /**
   * Edit a note
   * @param {Object} req - The request object
   * @param {Object} res - The response object
   * @returns {Promise} - A promise that resolves to an object containing the updated note data
   */
  editNotes: async (req, res) => {
    logger.info('POST /editNotes route accessed');

    try {
      const objectId = req.params.id;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(objectId)) {
        return res.status(400).json({
          apiResponseData: {
            apiResponseMessage: 'Invalid note ID format'
          },
          apiResponseStatus: false
        });
      }

      // Prepare update object dynamically
      const updateData = {};

      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.isFavourite !== undefined) updateData.isFavourite = req.body.isFavourite;
      // if (req.body.reminder !== undefined) updateData.reminder = req.body.reminder;
      if (req.body.tag !== undefined) updateData.tag = req.body.tag;

      // Update Note
      const updatedNote = await Note.findOneAndUpdate(
        { _id: objectId, userId: req.user.id },
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
      const note = await Note.findOne({ _id: id, userId: req.user.id });

      console.log(note)
      if (!note) {
        return res.status(404).json({
          apiResponseData: { apiResponseMessage: 'Note not found or already active' },
          apiResponseStatus: false
        });
      }

      note.isDeleted = false;
      note.deletedAt = null;

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
        userId: req.user.id,
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
      // correct param name
      const noteId = req.params.id;
      logger.debug(`[${requestId}] Incoming noteId: ${noteId}`);

      // validate ObjectId
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
        { _id: noteId, userId: req.user.id },
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
