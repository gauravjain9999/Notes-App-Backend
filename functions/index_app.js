// functions/index_app.js
const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require("./src/config/dbConnection");
// NOTE: require dbConnection only via index_export above so avoid requiring it here directly
const bodyParser = require('body-parser');
const noteRouter = require("./src/routers/notesRouter");
const userRoute = require("./src/routers/userRouter");
const helmet = require('helmet');
const logger = require('./src/utils/logger');
const verifyToken = require('./src/middleware/auth');


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

module.exports = app;
