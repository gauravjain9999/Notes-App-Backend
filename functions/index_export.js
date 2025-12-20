const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");

const connectDB = require("./src/config/dbConnection");

const noteRoute = require("./src/routers/notes.router");
const userRoute = require("./src/routers/user.router");
const notebookRouter = require("./src/routers/notebook.router");
const fileRouter = require("./src/routers/file.router");

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
app.use(verifyToken, notebookRouter);
app.use(verifyToken, fileRouter)

module.exports = app;
