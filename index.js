const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('./src/db/mongoose');
const bodyParser = require('body-parser');
const noteRouter = require("./src/routers/notesRouter");
const userRoute = require("./src/routers/user");
const port = process.env.port || 7000;
const helmet = require('helmet');
const url = require('url');

app.use(cors());
app.use(helmet());
app.options('*', cors());
app.use(express.json());
app.use(express.static('/uploads'));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:7000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


// app.use((req, res, next) =>{
//     const urlObj = url.parse(req.url)
//     console.log(urlObj);

//     console.log("HTTP Method - " + req.method + ", URL", + req.baseUrl + req.path);
//     next();
//   })


app.use(noteRouter);
app.use(userRoute);

app.listen(port,  () =>{
    console.log(`App is Running on Port ${port}`);
//  const io = require('socket.io');
})