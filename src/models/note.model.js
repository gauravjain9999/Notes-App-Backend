const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ["quick", "idea", "todo", "reminder"],
    required: false
  },
  title: String,
  description: String,
  pin: { type: Boolean, default: false },
  isFavourite: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  reminder: { type: Date, default: null },
  isDeleted: { type: Boolean, default: false },
  tag: { type: [String], default: [] },
}, {
  timestamps: true
}
);

module.exports = mongoose.model('Note', noteSchema.index({ userId: 1, updatedAt: -1 }));