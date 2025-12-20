const Note = require("../models/note.model");
const mongoose = require("mongoose");

module.exports = {
  setReminder: async (req, res) => {
    console.log("Request Body:", req.body);
    try {
      const { reminder } = req.body;
      const note = await Note.findByIdAndUpdate(
        req.params.id,
        { $set: { reminder: reminder ? new Date(reminder) : null } },
        { new: true }
      );
      if (!note)
        return res.status(404).json({
          apiResponseData: {
            apiResponseMessage: "Note not found",
          },
          apiResponseStatus: true,
        });
      res.json({
        apiResponseData: {
          apiResponseMessage: "Reminder set successfully. You will be notified.",
          data: note,
        },
        apiResponseStatus: true,
      });
    } catch (error) {
    //   logger.info("Error updating reminder:", error);
      res.status(500).json({
        apiResponseData: {
          apiResponseMessage: "Failed to update reminder",
        },
        apiResponseStatus: false,
      });
    }
  },
};
