const jwt = require('jsonwebtoken');

const verifyToken = async(req, res, next) =>{
   let token = req.body.authorizationToken || req.header['authorizationToken'];
   console.log('Token is', token);
   try{
      let authToken = token.split(' ')[1];
      console.log('Auth Token is ', authToken); 
      let decode = jwt.verify(authToken, 'SECRET_KEY');
      req.UserData = decode;
   }
   catch(error){
      console.log(error);
      res.status(401).json({message: "Invalid Token"})
   }
   next();
}
module.exports = verifyToken;