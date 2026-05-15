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
router.patch('/remove-shortcut/:id', verifyToken, notesController.removedShortcutNotes);
router.post('/send-notification', verifyToken, notificationsController.sendNotification);
router.post('/notifications-token', verifyToken, notificationsController.registerToken);
router.post('/quick-notes', verifyToken, notesController.createQuickNote);
router.post('/ideas', verifyToken, notesController.createIdeaNote);
router.post('/todos', verifyToken, notesController.createTodoNote);
router.post('/reminders', verifyToken, notesController.createReminderNote);

/**
 * 2️⃣ Send release / broadcast notification (Admin / CI / Postman)
 */
// router.post(
//     '/notifications/release',
//     notificationsController.sendReleaseNotification
// );

/**
 * 3️⃣ Send notification to a single user (Backend event)
 */
// router.post(
//     '/notifications/user',
//     notificationsController.sendToUser
// );

/**
 * 4️⃣ Send topic-based broadcast (System announcements)
 */
// router.post(
//     '/notifications/broadcast',
//     notificationsController.sendBroadcast
// );

module.exports = router;