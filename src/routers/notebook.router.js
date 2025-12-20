const express = require('express');
const notebookController = require('../controller/notebook.controller');
const router = new express.Router();

router.get('/notebook', notebookController.getNotebook);
router.post('/add-notebook', notebookController.createNotebook);
router.put('/update-notebook/:id',notebookController.updateNoteBook);
router.delete('/delete-notebook/:id', notebookController.deleteNoteBook);

module.exports = router;