const mongoose = require('mongoose');
const dotenv = require("dotenv").config();

mongoose.set('strictQuery', true);
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() =>{
    console.log('Connect with the Database !!');
}).catch(err =>{
    console.log('Connection Fail', err);
})
