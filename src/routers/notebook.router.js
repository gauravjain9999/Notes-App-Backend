const express = require('express');
const notebookController = require('../controller/notebook.controller');
const router = new express.Router();
const verifyToken = require('../middleware/auth'); // Add auth middleware

router.use(verifyToken);
router.get('/notebook', notebookController.getNotebook);
router.post('/add-notebook', notebookController.createNotebook);
router.put('/update-notebook/:id', notebookController.updateNoteBook);
router.delete('/delete-notebook/:id', notebookController.deleteNoteBook);

module.exports = router;