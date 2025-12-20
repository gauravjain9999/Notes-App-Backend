const express = require('express');
const router = new express.Router();
const notesController = require('../controller/notesController');
const emailController = require('../controller/emailController');
const openAIBotController = require('../controller/openAIBotController');
const remindersController = require('../controller/remindersController');

router.get('/notes', notesController.getNotes);
router.post('/add-notes', notesController.addNotes);
router.delete('/delete-notes/:id', notesController.deleteNotes);
router.delete('/delete-trashed-notes/:id', notesController.deleteInTrashedNotes);
router.delete('/delete-all', notesController.deleteAllNotes)
router.put('/update-notes/:id', notesController.editNotes);
router.post('/send-email', emailController.sendEmail);
router.post('/notes/api/chat', openAIBotController.openAIBot);
router.patch('/notes-set-reminder/:id/reminder', remindersController.setReminder);
router.patch('/notes-restore/:id', notesController.restoreNote);

module.exports = router;