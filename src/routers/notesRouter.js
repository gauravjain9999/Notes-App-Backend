const express = require('express');
const router = new express.Router();
const cloud =require('cloudinary').v2;
const upload = require('../middleware/file-upload');
const notesController = require('../controller/notesController');

router.get('/notes', notesController.getNotes);
router.post('/add-notes', notesController.addNotes);
router.post('/upload', upload.single('image'), notesController.uploadFile);
router.delete('/delete-notes/:id',notesController.deleteNotes);
router.delete('/delete-all', notesController.deleteAllNotes)
router.put('/update-notes/:id', notesController.editNotes);

module.exports = router;