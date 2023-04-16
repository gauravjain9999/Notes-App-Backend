const jwt = require('jsonwebtoken');

const verifyToken = async(req, res, next) =>{
    var token = req.body.authorizationToken || req.header['authorizationToken'];
    console.log('Token is', token);
    try{
       var authToken = token.split(' ')[1];
       console.log('Auth Token is ', authToken); 
       var decode = jwt.verify(authToken, 'SECRET_KEY');
       req.UserData = decode;
    }
    catch(error){
       console.log(error);
       res.status(401).json({message: "Invalid Token"})
    }
    next();
}

module.exports = verifyToken;