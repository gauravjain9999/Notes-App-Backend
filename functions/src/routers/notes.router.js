const express = require('express');
const router = new express.Router();
const notesController = require('../controller/notesController');
const openAIBotController = require('../controller/openAIBotController');
const remindersController = require('../controller/remindersController');
const notificationsController = require('../controller/notification.controller');
const verifyToken = require('../middleware/auth');

router.get('/notes', verifyToken, notesController.getNotes);
router.post('/add-notes', verifyToken, notesController.addNotes);
router.delete('/delete-notes/:id', verifyToken, notesController.deleteNotes);
router.delete('/delete-trashed-notes/:id', verifyToken, notesController.deleteInTrashedNotes);
router.delete('/delete-all', verifyToken, notesController.deleteAllNotes)
router.put('/update-notes/:id', verifyToken, notesController.editNotes);
router.post('/api-notes-chatbot', verifyToken, openAIBotController.openAIBot);
router.get('/chat-history-notes', verifyToken, openAIBotController.getChatHistory);
router.patch('/notes-set-reminder/:id/reminder', verifyToken, remindersController.setReminder);
router.patch('/notes-restore/:id', verifyToken, notesController.restoreNote);
router.get('/shortcut-list', verifyToken, notesController.shortcutNotes);
router.post('/notifications-token', verifyToken, notificationsController.registerToken);
router.patch('/remove-shortcut/:id', verifyToken, notesController.removedShortcutNotes);
router.post('/send-notification', verifyToken, notificationsController.sendNotification);
router.post('/quick-notes', verifyToken, notesController.createQuickNote);
router.post('/ideas', verifyToken, notesController.createIdeaNote);
router.post('/todos', verifyToken, notesController.createTodoNote);
router.post('/reminders', verifyToken, notesController.createReminderNote);

module.exports = router;