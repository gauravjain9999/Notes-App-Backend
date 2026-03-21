const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('./src/config/dbConnection');
const bodyParser = require('body-parser');
const noteRouter = require("./src/routers/notes.router");
const notebookRouter = require("./src/routers/notebook.router");
const fileRouter = require("./src/routers/file.router");
const userRoute = require("./src/routers/user.router");
const dotenv = require("dotenv").config();
const helmet = require('helmet');
const port = process.env.PORT || 9000;
const logger = require('./src/utils/logger');
const verifyToken = require('./src/middleware/auth');

app.use(cors());
app.use(helmet());
app.options('*', cors());
app.use(express.json());
app.use(express.static('/uploads'));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(userRoute);
app.use(verifyToken, noteRouter);
app.use(verifyToken, notebookRouter);
app.use(verifyToken, fileRouter);


app.listen(port, () => {
    logger.info(`***** Server started on http://localhost:${port} *****`);
    console.log(`App is Running on Port ${port}`);
})
