const mongoose = require('mongoose');

// Child note schema
const ChildNoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdAt: { type: String, required: true },
}, { timestamps: true });

// Parent notebook schema
const NotebookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  expanded: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: String, required: true },
  children: [ChildNoteSchema]
}, { timestamps: true });

module.exports = mongoose.model('Notebook', NotebookSchema);
