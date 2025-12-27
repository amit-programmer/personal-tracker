const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

async function authMiddleware(req, res, next) {
    let token = req.cookies.token;
    
    if (!token) {
      const authHeader = req.header('Authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if(!token){
        return res.status(401).json({ message: 'No token provided' });
    }

    try{
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    }
    catch(err){
        // Silently handle JWT errors (expected for invalid tokens)
        return res.status(401).json({ message: 'Invalid token' });
    }
}


module.exports = {
    authMiddleware
}