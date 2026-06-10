const mongoose = require("mongoose");
const webClipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  url: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    default: "",
  },

  image: {
    type: String,
    default: "",
  },

  favicon: {
    type: String,
    default: "",
  },

  // tags: [
  //   {
  //     type: String,
  //   },
  // ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("WebClip", webClipSchema);
