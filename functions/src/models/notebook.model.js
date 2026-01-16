const mongoose = require("mongoose");

const ChildNoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { timestamps: true }
);
const NotebookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    expanded: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
    children: [ChildNoteSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notebook", NotebookSchema);
