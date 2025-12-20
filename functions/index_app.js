const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require("./src/config/dbConnection");
// NOTE: require dbConnection only via index_export above so avoid requiring it here directly
const bodyParser = require('body-parser');
const noteRouter = require("./src/routers/notes.router");
const userRoute = require("./src/routers/user.router");
const helmet = require('helmet');
const verifyToken = require('./src/middleware/auth');
const notebookRouter = require("./src/routers/notebook.router");
const fileRouter = require("./src/routers/file.router");

// Connect DB (Firebase will wait for this)
connectDB();
// middlewares
app.use(cors());
app.use(helmet());
app.options('*', cors());
app.use(express.json());
app.use(express.static('/uploads'));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(userRoute);
app.use(verifyToken, noteRouter);
app.use(verifyToken, notebookRouter);
app.use(verifyToken, fileRouter)

module.exports = app;
