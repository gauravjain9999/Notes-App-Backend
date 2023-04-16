const Note = require('../models/note');
const mongoose = require('mongoose');

//Get Notes
module.exports = {
  getNotes: async (req, res) => {
    try {
      const notes = await Note.find();
      res.status(200).json({
        apiResponseData: {
          notesList: notes,
        },
        apiResponseStatus: true,
      });
    } catch (error) {
      return res.status(500).json({
        apiResponseData: {
          apiResponseMessage: 'Something went Wrong.Please try Again later !',
        },
      });
    }
  },

  //Add Notes
  addNotes: (req, res) => {
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

  //Upload File (Image)
  uploadFile: (req, res) => {
    let notesData = new Note({
      _id: new mongoose.Types.ObjectId(),
      image: req.file.path,
    });
    console.log(req.file);  
    notesData
      .save()
      .then((result) => {
        console.log(result);
        res.status(200).json({
          apiResponseData: {
            apiResponseMessage: 'Image is Successfully uploaded.',
          },
          attachmentUrl: result.image,
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

  //Delete All Notes
  deleteAllNotes: async(req, res) =>{
    try {
      await Note.deleteMany({});
      res.status(200).json({
        apiResponseData: {
          apiResponseMessage: 'All Notes Deleted.',
        },
        apiResponseStatus: true,
      });
    } 
    catch (error) {
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: 'Something Went Wrong.Please try again !',
        },
      }
    );
  }
 },

  //Delete Notes
  deleteNotes: async(req, res) => {
    var objectId = req.params.id;
    try {
      const result = await Note.deleteOne({
        _id: new mongoose.mongo.ObjectId(objectId),
      });
      res.status(200).json({
        apiResponseData: {
          apiResponseMessage: 'Notes Deleted.',
        },
        apiResponseStatus: true,
      });
    } 
    catch (error) {
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: 'Something Went Wrong.Please try again !',
        },
      });
    }
  },

  //Edit Notes
  editNotes: async(req, res) => {
    let objectId = req.params.id;
    try{ 
        await Note.findOneAndUpdate({
        _id: objectId,
      },  
      {
        $set: {
          title: req.body.title,
          description: req.body.description
        }
    })
    .then(result =>{
      res.status(200).json({
        apiResponseData:{
          apiResponseMessage: 'Update Notes Successfully.'
        },
        apiResponseStatus: true
      });
    })
   }
    catch(error){
      res.status(500).json({
        apiResponseData:{
          apiResponseMessage: 'Something Went Wrong.Please try again !'
        }
      });
    }
  }
};
