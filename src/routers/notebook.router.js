const express = require("express");
const notebookController = require("../controller/notebook.controller");
const router = new express.Router();
const verifyToken = require("../middleware/auth"); // Add auth middleware

router.use(verifyToken);
router.get("/notebook", notebookController.getNotebook);
router.post("/add-notebook", notebookController.createNotebook);
router.patch("/update-notebook/:id", notebookController.updateNoteBook);
router.delete("/delete-notebook/:id", notebookController.deleteNoteBook);
router.post("/add-notes-to-notebook", notebookController.addNotesInBook);
router.patch("/notebook/note/:id", notebookController.updateNote);

module.exports = router;
