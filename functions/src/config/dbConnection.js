const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log("Connected with the Database");
  } catch (err) {
    console.log("Connection Fail", err);
    throw err;
  }
};

module.exports = connectDB;
