const express = require('express');
const User = require('../models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt =  require('jsonwebtoken');

//SignUp Registration
module.exports = {
  signUpUser: async(req, res) => {
    const result = bcrypt.hash(req.body.password, 10, (err, hash) =>{  
      console.log('Error', err);
        if(err){
          return res.status(500).send(err)
        } 
        else {
          const user = new User({
            _id: new mongoose.Types.ObjectId,
            username: req.body.username,
            password: hash,
            phone: req.body.phone,
            email: req.body.email,
            userType: req.body.userType
          })
          user.save().then(result =>{
            console.log('Result', result);
            res.status(200).json({
              apiResponseData: {
                apiResponseMessage: "Successfully SignUp. Please Login Now!"
              },
              apiResponseStatus: true
            })
          })
          .catch(err =>{
            res.status(500).json({error: err})
          })
        }
      }
    )
  },

  //Login User
  loginUser : async(req, res) =>{
    User.find({email: req.body.email})
    .exec()
    .then(user =>{
      if(user.length < 1){
        return res.status(401).json({
          message: "User Not Exist"
        })
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) =>{
        if(!result){
          return res.status(401).json({
            message: 'Password Not Correct'
          })
        }
        if(result){
          const authorizationToken = jwt.sign({
            username: user[0].username,
            userType: user[0].userType,
            email: user[0].email,
            phone: user[0].phone             
          },
          'SECRET_KEY',
          {expiresIn: "24"},
          );
          res.status(200).json({
            apiResponseData: {  
              email: user[0].email,
              phone: user[0].phone,
              userName: user[0].username,
              authorizationToken: `Bearer ${authorizationToken}`,
            },
            apiResponseStatus: true
          })
        }
      })
    })
    .catch(err =>{
      res.status(500).json({
        message: err
      })
    })
  }
};
