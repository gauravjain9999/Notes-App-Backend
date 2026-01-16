const mongoose = require('mongoose');

// Child note schema
const ChildNoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdAt: { type: String, required: true },
}, { timestamps: true });

// Parent notebook schema
const NotebookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  }, // ✅ link notebook to user
  title: { type: String, required: true },
  expanded: { type: Boolean, default: false },
  createdAt: { type: String, required: true }, // can keep email or string
  children: [ChildNoteSchema]
}, { timestamps: true }); // ✅ createdAt & updatedAt auto

module.exports = mongoose.model('Notebook', NotebookSchema);
