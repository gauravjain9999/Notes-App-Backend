// const functions = require("firebase-functions/v2");
// const { defineString } = require("firebase-functions/params");
// const path = require("path");

// // Read Firebase param
// const mongoUri = defineString("DB_URI");


// // Set process.env for mongoose
// process.env.DB_URI = mongoUri.value();

// // Import express app
// const expressApp = require("./index_export");

// // Deploy function
// exports.api = functions.https.onRequest({
//   cors: true,
//   expressApp
// });


const functions = require("firebase-functions/v2");
const { defineString } = require("firebase-functions/params");
const mongoUri = defineString("DB_URI");

// Import express app (but do NOT connect DB yet)
const expressApp = require("./index_export");

exports.api = functions.https.onRequest({
  cors: true
}, async (req, res) => {
  // Safe to access DB_URI here
  process.env.DB_URI = mongoUri.value();

  // Let your express app handle the request
  return expressApp(req, res);
});

