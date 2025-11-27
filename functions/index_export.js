const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");

const connectDB = require("./src/config/dbConnection");

const userRoute = require("./src/routers/userRouter");
const noteRoute = require("./src/routers/notesRouter");
const verifyToken = require("./src/middleware/auth");

const app = express();

// Connect to MongoDB (before routes)
connectDB();

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json());
app.use(bodyParser.json());

app.use(userRoute);
app.use(verifyToken, noteRoute);

module.exports = app;
