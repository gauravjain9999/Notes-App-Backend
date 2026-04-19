const mongoose = require("mongoose");

const feedBackSchema = new mongoose.Schema({

    email: String,
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    message: {
        type: String,
        required: true,
        minlength: 5
    }

}, { timestamps: true });

feedBackSchema.index({ email: 1 }, { unique: true });
module.exports = mongoose.model("Feedback", feedBackSchema);