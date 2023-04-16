const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect("mongodb://localhost:27017/Notes", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() =>{
    console.log('Connect with the Database');
}).catch(err =>{
    console.log('Connection Fail', err);
})
