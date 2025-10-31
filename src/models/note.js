const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
    title: String,
    description: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    reminder: { type: Date, default: null },
  }, {
    timestamps: true
  }
);

module.exports = mongoose.model('Note', noteSchema);