const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
  title: String,
  description: String,
  isFavourite: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  reminder: { type: Date, default: null },
  isDeleted: { type: Boolean, default: false },
  tag: { type: [String], default: [] },
}, {
  timestamps: true
}
);
module.exports = mongoose.model('Note', noteSchema);