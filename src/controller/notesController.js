const Note = require('../models/note');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const uploadFile = require('../models/upload');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('./S3ClientController');
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
      const notes = await Note.find();
      // Return the notes list to the client
      logger.info('GET / route accessed');
      res.status(200).json({
        apiResponseData: {
          /**
           * An array of objects containing the notes data.
           * @type {Array<Object>}
           */
          notesList: notes,
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

  /**
   * @function uploadFile
   * @description Handles file upload and saves file metadata to the database.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  uploadFile: async (req, res) => {

    logger.info('POST /upload route accessed');

    if (!req.file) {
      logger.warn('No file uploaded in request.');
      return res.status(400).json({
        apiResponseData: {
          apiResponseMessage: 'No file uploaded.',
        },
        apiResponseStatus: false,
      });
    }

    const file = req.file;
    const fileName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await s3.send(new PutObjectCommand(uploadParams));
      const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      const fileData = new uploadFile({
        fileName: file.originalname,
        s3Url: s3Url,
        uploadedAt: new Date(),
        contentType: file.mimetype,
      });
      await fileData.save();
      logger.info(`File uploaded and saved: ${fileData.fileName}`);
      res.status(200).json({
        apiResponseData: {
          apiResponseMessage: 'File uploaded successfully.',
        },
        apiResponseStatus: true,
      });
    } catch (err) {
      logger.error('Error saving uploaded file:', err);
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: 'Something went wrong. Please try again!',
        },
        apiResponseStatus: false,
      });
    }

    // logger.info('POST /uploadFile route accessed');
    // if (!req.file) {
    //   logger.warn('No file uploaded in request.');
    //   return res.status(400).json({
    //   apiResponseData: {
    //     apiResponseMessage: 'No file uploaded.',
    //   },
    //   apiResponseStatus: false,
    //   });
    // }
    // Construct file data object
    // const fileData = new uploadFile({
    //   filename: req.file.filename, // Filename of the uploaded file
    //   uploadedAt: new Date(), // Timestamp when the file was uploaded
    //   url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`, // Full URL to access the file
    //   contentType: req.file.mimetype, // File MIME type
    // });

    // Save file data to the database
    // fileData
    //   .save()
    //   .then((result) => {
    //   logger.info(`File uploaded and saved: ${result.filename}`);
    //   res.status(200).json({
    //     apiResponseData: {
    //     apiResponseMessage: 'File uploaded successfully.',
    //     },
    //     // file: result, // Return saved file data
    //     apiResponseStatus: true,
    //   });
    //   })
    //   .catch((err) => {
    //   logger.error('Error saving uploaded file:', err);
    //   res.status(500).json({
    //     apiResponseData: {
    //     apiResponseMessage: 'Something went wrong. Please try again!',
    //     },
    //     apiResponseStatus: false,
    //   });
    //   });
    // 
    // if (!req.file) {
    //   return res.status(400).json({
    //     apiResponseData: {
    //       apiResponseMessage: 'No file uploaded.',
    //     },
    //     apiResponseStatus: false,
    //   });
    // }
  },

  //Delete All Notes
  deleteAllNotes: async (req, res) => {
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

  //Delete Notes
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
      id,
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
  }
};
